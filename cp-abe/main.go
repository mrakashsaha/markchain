package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	cpabe "github.com/cloudflare/circl/abe/cpabe/tkn20"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

var publicKey cpabe.PublicKey
var masterSecretKey cpabe.SystemSecretKey

const (
	policyStr1 = `(role: admin) or (role: teacher) or (role: student)`
	policyStr2 = `(role: teacher) or (role: student)`
)

func init() {
	// Setup public and master secret keys
	var err error
	publicKey, masterSecretKey, err = cpabe.Setup(rand.Reader)
	if err != nil {
		log.Fatalf("Setup failed: %s", err)
	}
}

// API to generate key for a given role
func generateKeyHandler(w http.ResponseWriter, r *http.Request) {
	role := mux.Vars(r)["role"]

	attributes := cpabe.Attributes{}
	attributes.FromMap(map[string]string{"role": role})
	secretKey, err := masterSecretKey.KeyGen(rand.Reader, attributes)
	if err != nil {
		http.Error(w, "Failed to generate key", http.StatusInternalServerError)
		return
	}

	secretKeyBinary, err := secretKey.MarshalBinary()
	if err != nil {
		http.Error(w, "Failed to marshal key", http.StatusInternalServerError)
		return
	}
	encodedSecretKey := base64.StdEncoding.EncodeToString(secretKeyBinary)

	w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(encodedSecretKey))
}

// API to encrypt data
func encryptHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Data   string `json:"data"`
		Policy string `json:"policy"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var policyStr string
	switch req.Policy {
	case "1":
		policyStr = policyStr1
	case "2":
		policyStr = policyStr2
	default:
		http.Error(w, "Invalid policy value", http.StatusBadRequest)
		return
	}

	policy := cpabe.Policy{}
	if err := policy.FromString(policyStr); err != nil {
		http.Error(w, "Invalid policy", http.StatusInternalServerError)
		return
	}

	ct, err := publicKey.Encrypt(rand.Reader, policy, []byte(req.Data))
	if err != nil {
		http.Error(w, "Encryption failed", http.StatusInternalServerError)
		return
	}

	ctBase64 := base64.StdEncoding.EncodeToString(ct)
	w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(ctBase64))
}

// API to decrypt data
func decryptHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Data string `json:"data"`
		Key  string `json:"key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ct, err := base64.StdEncoding.DecodeString(req.Data)
	if err != nil {
		http.Error(w, "Invalid ciphertext", http.StatusBadRequest)
		return
	}

	keyBinary, err := base64.StdEncoding.DecodeString(req.Key)
	if err != nil {
		http.Error(w, "Invalid key", http.StatusBadRequest)
		return
	}

	secretKey := new(cpabe.AttributeKey)
	if err := secretKey.UnmarshalBinary(keyBinary); err != nil {
		http.Error(w, "Failed to unmarshal key", http.StatusInternalServerError)
		return
	}

	pt, err := secretKey.Decrypt(ct)
	if err != nil || pt == nil {
		http.Error(w, "Decryption failed", http.StatusForbidden)
		return
	}

	w.Header().Set("Access-Control-Allow-Origin", "*") // Allow all origins
	w.WriteHeader(http.StatusOK)
	w.Write(pt)
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/generate-key/{role}", generateKeyHandler).Methods("GET")
	r.HandleFunc("/encrypt", encryptHandler).Methods("POST")
	r.HandleFunc("/decrypt", decryptHandler).Methods("POST")

	// Allow all origins for all routes
	handler := cors.Default().Handler(r)

	fmt.Println("CP-ABE Server Running on port 8000")
	log.Fatal(http.ListenAndServe(":8000", handler))
}
