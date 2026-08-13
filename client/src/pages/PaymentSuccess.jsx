import { useEffect, useState } from "react";
import axios from "axios";

function PaymentSuccess() {
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verify = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const reference = params.get("reference");

        if (!reference) {
          setMessage("Payment reference not found.");
          return;
        }

        const token = localStorage.getItem("token");

        await axios.post(
          "http://localhost:5000/api/payment/verify",
          {
            reference,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage("Payment successful! Your Premium account is now active.");
      } catch (error) {
        console.log(error);
        setMessage("Payment verification failed.");
      }
    };

    verify();
  }, []);

  return (
    <div>
      <h2>{message}</h2>
    </div>
  );
}

export default PaymentSuccess;