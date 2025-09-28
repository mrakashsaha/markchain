// src/App.js
import React, { useEffect } from "react";
import { getFromIPFS } from "../../ipfsClient/ipfsCURD";


function StudentHome() {
    useEffect(() => {


        getFromIPFS("QmU4sgSjFPc7vSPoENAQfbPAryKgwu3go9zBKcL44Q1Lhf")
            .then((result) => console.log("d", result))
            .catch((error) => console.log(error))


    }, [])


    return (
        <div>
            <h1>Student Dashboard</h1>
            <h1>Check console for IPFS CID</h1>;
        </div>
    );
}

export default StudentHome;
