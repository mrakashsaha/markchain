import React, { useContext, useState } from 'react';
import { getContract } from '../../../hook/useContract';
import { AuthContext } from '../../../contextAPI/AuthContext';

// DecryptAllCIDs
// - fetches all CIDs from the smart contract for the logged-in user
// - for each CID it fetches ipfs data from /ipfsData?cid=... on your backend
// - finds the encryptedKey entry that matches the student's wallet address
// - calls POST /decrypt on your backend with the user's private key and the required fields
// - shows results and errors

export default function MyResult() {
  const { userInfo } = useContext(AuthContext);
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]); // { cid, ok, data, error }

  // helpers
  const normalizeAddress = (a = '') => (a || '').toLowerCase();

  const decryptSingle = async (ipfsJson, recipientEncryptedKey) => {
    // ipfsJson must contain iv, authTag, ciphertext
    const body = {
      recipientPrivateKey: privateKey,
      encryptedKey: recipientEncryptedKey,
      iv: ipfsJson.iv,
      authTag: ipfsJson.authTag,
      ciphertext: ipfsJson.ciphertext,
    };

    const resp = await fetch('http://localhost:5000/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`decrypt endpoint error: ${resp.status} ${txt}`);
    }

    const json = await resp.json();
    return json; // expected decrypted payload
  };

  const handleDecryptAll = async () => {
    if (!privateKey || privateKey.trim().length === 0) {
      alert('Please paste your PRIVATE KEY before decrypting.');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const contract = await getContract();
      const cids = await contract.listAllCidsByStudent(userInfo.walletAddress);

      const out = [];

      for (let i = 0; i < cids.length; i++) {
        const cid = cids[i];
        const itemResult = { cid, ok: false, data: null, error: null };

        try {
          // fetch IPFS JSON from your backend
          const ipfsResp = await fetch(`http://localhost:5000/ipfsData?cid=${cid}`);
          if (!ipfsResp.ok) throw new Error(`ipfsData fetch failed: ${ipfsResp.status}`);
          const ipfsJson = await ipfsResp.json();

          // find encryptedKey entry whose recipientId matches the user's wallet address
          const recipient = normalizeAddress(userInfo.walletAddress);
          let match = null;
          if (Array.isArray(ipfsJson.encryptedKeys)) {
            match = ipfsJson.encryptedKeys.find(e => normalizeAddress(e.recipientId) === recipient);
          }

          // if no exact match, try a fallback: try each encryptedKey (useful if stored addresses are different form)
          if (!match && Array.isArray(ipfsJson.encryptedKeys)) {
            // try each encryptedKey until decrypt endpoint succeeds
            let decrypted = null;
            for (let ek of ipfsJson.encryptedKeys) {
              try {
                const dec = await decryptSingle(ipfsJson, ek.encryptedKey);
                // success
                itemResult.ok = true;
                itemResult.data = dec;
                decrypted = dec;
                break;
              } catch (err) {
                // ignore and try next
                console.log(err);
              }
            }

            if (!decrypted) {
              throw new Error('No encryptedKey worked with provided private key (fallback).');
            }

          } else if (match) {
            // we have a match for this recipient
            const dec = await decryptSingle(ipfsJson, match.encryptedKey);
            itemResult.ok = true;
            itemResult.data = dec;
          } else {
            throw new Error('No encryptedKeys array found in IPFS data');
          }
        } catch (err) {
          itemResult.error = (err && err.message) || String(err);
        }

        out.push(itemResult);
        // update UI progressively
        setResults(prev => [...prev, itemResult]);
      }

      setLoading(false);
      // ensure final state
      setResults(out);
    } catch (err) {
      setLoading(false);
      alert('Failed to fetch CIDs or decrypt: ' + (err && err.message));
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-medium mb-2">Decrypt all your submitted CIDs</h3>

      <label className="block mb-2 text-sm">Paste your PRIVATE KEY (PEM) here</label>
      <textarea
        rows={8}
        value={privateKey}
        onChange={e => setPrivateKey(e.target.value)}
        className="w-full p-2 border rounded mb-3"
        placeholder={`-----BEGIN PRIVATE KEY-----\n...`}
      />

      <div className="flex gap-2">
        <button
          onClick={handleDecryptAll}
          disabled={loading}
          className="btn"
        >
          {loading ? 'Decrypting...' : 'Decrypt all CIDs'}
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold">Results</h4>
        {results.length === 0 && <p className="text-sm text-gray-500">No results yet.</p>}

        <ul className="mt-2 space-y-3">
          {results.map((r, idx) => (
            <li key={r.cid + idx} className="p-3 border rounded">
              <div className="text-xs text-gray-600">CID: {r.cid}</div>
              {r.ok ? (
                <pre className="mt-2 whitespace-pre-wrap text-sm">{JSON.stringify(r.data, null, 2)}</pre>
              ) : (
                <div className="mt-2 text-sm text-red-600">Error: {r.error}</div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <strong>Security note:</strong> This component posts your private key to <code>http://localhost:5000/decrypt</code> because
        that endpoint expects the private key. Only use this with a backend you trust. A safer alternative is to perform
        decryption in the browser (client-side) so you never transmit the private key — if you want, I can provide a
        client-side decryption version that uses the WebCrypto API instead.
      </div>
    </div>
  );
}
