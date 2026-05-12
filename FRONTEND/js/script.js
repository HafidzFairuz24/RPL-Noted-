console.log("Frontend jalan");

const BASE_URL = "http://localhost:5000";
async function testBackend() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth`, {
            method: "GET"
        });

        const data = await response.text();
        console.log("Response backend:", data);

    } catch (error) {
        console.log("Backend error:", error);
    }
}
testBackend();