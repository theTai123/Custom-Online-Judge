#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <windows.h>
#include <psapi.h>

using namespace std;
namespace fs = std::filesystem;

int timeoutMs = 1000;
size_t memoryLimitBytes = 256 * 1024 * 1024;

enum Verdict {
    ACCEPTED,
    WRONG_ANSWER,
    COMPILE_ERROR,
    RUNTIME_ERROR,
    TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED,
    INTERNAL_ERROR
};

string verdictToString(Verdict v) {
    switch (v) {
        case ACCEPTED: return "AC";
        case WRONG_ANSWER: return "WA";
        case COMPILE_ERROR: return "CE";
        case RUNTIME_ERROR: return "RTE";
        case TIME_LIMIT_EXCEEDED: return "TLE";
        case MEMORY_LIMIT_EXCEEDED: return "MLE";
        default: return "IE";
    }
}

struct TestResult {
    Verdict verdict;
    double timeMs = 0;
    size_t memoryKB = 0;
};

bool compareWithFC(const string &outFile, const string &ansFile) {
    string cmd = "fc /W " + outFile + " " + ansFile + " > nul";
    return system(cmd.c_str()) == 0;
}

TestResult runTest(const string &executableFile, const string &inpFile, const string &ansFile) {
    TestResult result;
    string outFile = "sandbox\\output.OUT";

    // Khởi tạo các handles
    HANDLE hIn = INVALID_HANDLE_VALUE;
    HANDLE hOut = INVALID_HANDLE_VALUE;
    HANDLE hJob = NULL;
    PROCESS_INFORMATION pi{};
    ZeroMemory(&pi, sizeof(PROCESS_INFORMATION));

    try {
        SECURITY_ATTRIBUTES sa;
        sa.nLength = sizeof(sa);
        sa.lpSecurityDescriptor = NULL;
        sa.bInheritHandle = TRUE;

        hIn = CreateFile(inpFile.c_str(), GENERIC_READ, FILE_SHARE_READ, &sa, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hIn == INVALID_HANDLE_VALUE) throw runtime_error("Cannot open input file");

        hOut = CreateFile(outFile.c_str(), GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, &sa, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hOut == INVALID_HANDLE_VALUE) throw runtime_error("Cannot create output file");

        STARTUPINFO si{};
        si.cb = sizeof(si);
        si.dwFlags |= STARTF_USESTDHANDLES;
        si.hStdInput = hIn;
        si.hStdOutput = hOut;
        si.hStdError = hOut;

        hJob = CreateJobObject(NULL, NULL);
        if (!hJob) throw runtime_error("Cannot create job object");

        JOBOBJECT_EXTENDED_LIMIT_INFORMATION jeli{};
        jeli.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_JOB_MEMORY | JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;
        jeli.JobMemoryLimit = memoryLimitBytes;
        SetInformationJobObject(hJob, JobObjectExtendedLimitInformation, &jeli, sizeof(jeli));

        SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX);

        if (!SetInformationJobObject(hJob, JobObjectExtendedLimitInformation, &jeli, sizeof(jeli))) {
            throw runtime_error("Cannot set job object information");
        }

        if (!CreateProcess(executableFile.c_str(), NULL, NULL, NULL, TRUE, CREATE_SUSPENDED | CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
            throw runtime_error("Cannot start process");
        }

        AssignProcessToJobObject(hJob, pi.hProcess);
        ResumeThread(pi.hThread);

        auto start = chrono::high_resolution_clock::now();
        DWORD waitResult = WaitForSingleObject(pi.hProcess, timeoutMs + 200);
        auto stop = chrono::high_resolution_clock::now();
        result.timeMs = chrono::duration_cast<chrono::milliseconds>(stop - start).count();

        DWORD exitCode;
        GetExitCodeProcess(pi.hProcess, &exitCode);

        PROCESS_MEMORY_COUNTERS pmc{};
        GetProcessMemoryInfo(pi.hProcess, &pmc, sizeof(pmc));
        result.memoryKB = pmc.PeakWorkingSetSize / 1024;

        if (waitResult == WAIT_TIMEOUT || result.timeMs > timeoutMs) {
            result.verdict = TIME_LIMIT_EXCEEDED;
            TerminateProcess(pi.hProcess, 1);
        } else if (result.memoryKB > memoryLimitBytes / 1024) {
             result.verdict = MEMORY_LIMIT_EXCEEDED;
        } else if (exitCode != 0) {
            result.verdict = RUNTIME_ERROR;
        } else {
            CloseHandle(hOut);
            hOut = INVALID_HANDLE_VALUE;
            if (compareWithFC(outFile, ansFile)) {
                result.verdict = ACCEPTED;
            } else {
                result.verdict = WRONG_ANSWER;
            }
        }
    } catch (const runtime_error& e) {
        cerr << "Internal Error: " << e.what() << endl;
        result.verdict = INTERNAL_ERROR;
    }

    if (hIn != INVALID_HANDLE_VALUE) CloseHandle(hIn);
    if (hOut != INVALID_HANDLE_VALUE) CloseHandle(hOut);
    if (pi.hProcess) CloseHandle(pi.hProcess);
    if (pi.hThread) CloseHandle(pi.hThread);
    if (hJob) CloseHandle(hJob);

    return result;
}

void gradeSolution(const string &solutionFile, const string &problemTestPath, ofstream &fout) {
    cout << "Compiling: " << solutionFile << endl;
    string executableFile = "sandbox/programme.exe";
    string compileCmd = "g++ \"" + solutionFile + "\" -o " + executableFile + " -O2 -std=c++17 -static";

    int compileRet = system(compileCmd.c_str());
    if (compileRet != 0) {
        fout << "{\"fv\": \"" << verdictToString(COMPILE_ERROR) << "\"}";
        cerr << "Compile Error" << endl;
        return;
    }

    TestResult finalResult;

    int testCount = 0;
    int testAccepted = 0;
    for (const auto& entry : fs::directory_iterator(problemTestPath)) {
        if (!entry.is_directory()) continue;

        testCount++;
        string testName = entry.path().filename().string();
        string inpFile = entry.path().stem().string() + ".INP";
        string ansFile = entry.path().stem().string() + ".OUT";
        string ansFilePath = problemTestPath + "/" + testName + "/" + ansFile;
        string inpFilePath = problemTestPath + "/" + testName + "/" + inpFile;

        //cout << "Running Test ..." << endl;
        TestResult result = runTest(executableFile, inpFilePath, ansFilePath);

        if (result.verdict != ACCEPTED) {
            finalResult.verdict = result.verdict;
        } else {
            testAccepted++;
        }

        if(testAccepted == testCount) {
            finalResult.verdict = ACCEPTED;
        }

        finalResult.timeMs += result.timeMs;
        finalResult.memoryKB = max(finalResult.memoryKB, result.memoryKB);

        fout << "{"
             << "\"tc\": " << testCount << ", "
             << "\"v\": \"" << verdictToString(result.verdict) << "\", "
             << "\"t\": " << (result.verdict == TIME_LIMIT_EXCEEDED ? timeoutMs : result.timeMs) << ", "
             << "\"m\": " << (result.verdict == MEMORY_LIMIT_EXCEEDED ? memoryLimitBytes / 1024 : result.memoryKB)
             << "}," << endl;
    }

    fout << "{"
         << "\"fv\": \"" << verdictToString(finalResult.verdict) << "\", "
         << "\"ac\": " << testAccepted << ", "
         << "\"tt\": " << finalResult.timeMs << ", "
         << "\"pm\": " << finalResult.memoryKB
         << "}" << endl;
}

int main(int argc, char* argv[]) {
    if (argc < 3) {
        cerr << "Loi: Can cung cap 2 tham so." << endl;
        cerr << "Su dung: " << argv[0] << " <duong_dan_file_bai_lam> <duong_dan_thu_muc_testcase>" << endl;
        return 1;
    }

    string solutionFile = argv[1];
    string problemTestPath = argv[2];
    timeoutMs = stoi(string(argv[3]));
    memoryLimitBytes = stoi(string(argv[4])) * 1024 * 1024;
    string outputFile = "sandbox/output.json";

    cout << "Time limit: " << timeoutMs << " ms" << endl;
    cout << "Memory limit: " << memoryLimitBytes / (1024 * 1024) << " MB" << endl;

    ofstream fout(outputFile);
    if (!fout) {
        cerr << "Cannot open output file: " << outputFile << endl;
        return 1;
    }

    fout << "[" << endl;

    gradeSolution(solutionFile, problemTestPath, fout);

    fout << "]" << endl;
    fout.close();
    cout << "Grading finished. Results are in " << outputFile << endl;
    return 0;
}
