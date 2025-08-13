import { create } from "kubo-rpc-client";

const client = create({ url: "http://localhost:5001/api/v0" })

export const addToIPFS = async (obj) => {
    try {
        // Convert object to JSON string
        const jsonData = JSON.stringify(obj);

        // In browser, use Blob Binary Large Object to keep in IPFS
        const blob = new Blob([jsonData], { type: 'application/json' });

        // Upload to IPFS
        const { cid } = await client.add(blob);

        console.log("CID:", cid.toString());
        console.log("Gateway URL:", `https://ipfs.io/ipfs/${cid.toString()}`);

        return cid.toString();
    }

    catch (err) {
        console.error("Error uploading to IPFS:", err);
        alert("Failed to upload to IPFS. Check your IPFS node and CORS settings.");
    }

};


export async function getFromIPFS(cid) {
    try {
        // Read file as Uint8Array
        const stream = client.cat(cid);
        let data = '';
        for await (const chunk of stream) {
            data += new TextDecoder().decode(chunk);
        }
        const jsonData = JSON.parse(data);
        console.log("Data from IPFS:", jsonData);
        return jsonData;
    } catch (err) {
        console.error("Error fetching from IPFS:", err);
        alert("Failed to fetch data from IPFS");
    }
}