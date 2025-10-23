import React, { useState } from "react";
import { AuthContext } from "../../../contextAPI/AuthContext";
import { getContract } from "../../../hook/useContract";


const MyResult = () => {

    const [student, setStudent] = useState("");
    const [enrollmentId, setEnrollmentId] = useState("");
    const [course, setCourse] = useState("");
    const [semester, setSemester] = useState("");
    const [cid, setCid] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const checkIfTeacher = async () => {
        try {
            const contract = await getContract();

            const result = await contract.listAllCidsByStudent("0xe4120fe7dc9399b8319bc4f6d13a7836663d883a"); // call the mapping/view function

            console.log("Is Teacher:", result);
            return result; // true or false
        } catch (error) {
            console.error("Error checking teacher status:", error);
            return false;
        }
    };

    const handleSubmit = async () => {
        try {
            // Basic validation
            if (!student || !enrollmentId || !course || !semester || !cid) {
                alert("Please fill in student, enrollmentId, course, semester and CID.");
                return;
            }


            setLoading(true);

            const contract = await getContract(); // assume this returns a signer-connected contract
            if (!contract) throw new Error("Contract not found (getContract returned falsy).");

            console.log("Submitting marks to contract:", {
                student,
                enrollmentId,
                course,
                semester,
                cid,
                reason,
            });

            // Call contract: createSeries(address student, string enrollmentId, string courseCode, string semesterCode, string cid, string reason)
            const tx = await contract.createSeries(
                student,
                enrollmentId,
                course,
                semester,
                cid,
                reason || "initial upload"
            );

            // show user immediate feedback
            alert(`Transaction sent: ${tx.hash}\nWaiting for confirmation...`);

            await tx.wait();

            setLoading(false);
            alert("✅ Marks submitted successfully!");
            // optionally clear fields
            setStudent("");
            setEnrollmentId("");
            setCourse("");
            setSemester("");
            setCid("");
            setReason("");
        } catch (err) {
            console.error(err);
            setLoading(false);
            const message = err && err.message ? err.message : String(err);
            alert("❌ Transaction failed: " + message);
        }
    };

    return (
        <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Submit Marks</h2>

            <button onClick={checkIfTeacher}>CLick me</button>

            <input
                type="text"
                placeholder="Student Address (0x...)"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <input
                type="text"
                placeholder='Enrollment ID (e.g. "68f3cd848b3a913f6c90e752")'
                value={enrollmentId}
                onChange={(e) => setEnrollmentId(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <input
                type="text"
                placeholder='Course (e.g. "CSE141")'
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <input
                type="text"
                placeholder='Semester (e.g. "summer2025")'
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <input
                type="text"
                placeholder="IPFS CID (e.g. bafk...r3e)"
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <input
                type="text"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border p-2 block mb-2 w-full"
            />

            <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-blue-600"}`}
            >
                {loading ? "Submitting..." : "Submit"}
            </button>

            <p className="text-sm mt-2 text-gray-600">
                Note: teacher account (the connected signer) must be whitelisted via `setTeacher(...)`.
            </p>
        </div>
    );
};

export default MyResult;
