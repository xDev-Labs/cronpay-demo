"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import Image from "next/image";
import CronpayLogo from "../../public/icon.png";

type PaymentState = "initial" | "waiting" | "completed";

export default function Home() {
  const [paymentState, setPaymentState] = useState<PaymentState>("initial");
  const [transactionId, setTransactionId] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60); // 15 minutes in seconds
  const [isProcessing, setIsProcessing] = useState(false);

  const PRODUCT_PRICE = 100;
  const CURRENCY = "INR";
  const POLLING_INTERVAL = 5000; // 5 seconds

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Countdown timer
  useEffect(() => {
    if (paymentState !== "waiting") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState]);

  // Poll transaction status
  const checkTransactionStatus = useCallback(async () => {
    if (!transactionId) return;

    try {
      const response = await fetch("/api/transaction-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transactionId,
        }),
      });

      const data = await response.json();

      if (data.status === "completed") {
        setPaymentState("completed");
      }
    } catch (error) {
      console.error("Error checking transaction status:", error);
    }
  }, [transactionId]);

  // Polling effect
  useEffect(() => {
    if (paymentState !== "waiting") return;

    const pollInterval = setInterval(() => {
      checkTransactionStatus();
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [paymentState, checkTransactionStatus]);

  const handlePayWithCrypto = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/create-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currency: CURRENCY,
          amount: PRODUCT_PRICE,
        }),
      });

      const data = await response.json();

      if (data.id) {
        setTransactionId(data.id);
        setPaymentState("waiting");
        setTimeRemaining(15 * 60);

        // Open payment gateway in new tab
        window.open(
          `https://gateway.cronpay.xyz/transaction/${data.id}`,
          "_blank"
        );
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      alert("Failed to create transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-black">Checkout</CardTitle>
          <CardDescription className="text-black">Complete your purchase securely</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentState === "initial" && (
            <>
              {/* Product Display */}
              <div className="flex items-start gap-4 p-4 bg-slate-100 rounded-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-black">Premium Phone Case</h3>
                  <p className="text-sm text-muted-foreground">
                    Durable protection with elegant design
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Bestseller</Badge>
                    <span className="text-2xl font-bold text-black">₹{PRODUCT_PRICE}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="space-y-2 py-4 border-y">
                <div className="flex justify-between text-sm text-black">
                  <span className="text-muted-foreground ">Subtotal</span>
                  <span>₹{PRODUCT_PRICE}</span>
                </div>
                <div className="flex justify-between text-sm text-black">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 text-black">
                  <span>Total</span>
                  <span>₹{PRODUCT_PRICE}</span>
                </div>
              </div>

              {/* Payment Button */}
              <Button
                className="w-full h-12 text-lg cursor-pointer hover:bg-blue-600 hover:text-white"
                onClick={handlePayWithCrypto}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Pay with Crypto"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-2">
                Secure payment powered by
                <span className="flex items-center gap-2 font-bold text-blue-600">
                  <Image src={CronpayLogo} alt="CronPay" className="rounded-sm" width={16} height={16} />
                  <span className="text-purple-600">CronPay</span>
                </span>
              </p>
            </>
          )}

          {paymentState === "waiting" && (
            <>
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-black">
                  Waiting for transaction to be completed
                </h3>
                <p className=" text-black">
                  Please complete the payment in the opened tab
                </p>

                {/* Countdown Timer */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2 ">Time remaining</p>
                  <p className="text-4xl font-bold font-mono text-black">
                    {formatTime(timeRemaining)}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Transaction ID: {transactionId}
                </p>
              </div>
            </>
          )}

          {paymentState === "completed" && (
            <>
              <div className="text-center space-y-4 py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-green-600">
                  Your order has been placed!
                </h3>
                <p className="text-muted-foreground">
                  Thank you for your purchase. You will receive a confirmation email shortly.
                </p>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">
                    Order Number: {transactionId.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    setPaymentState("initial");
                    setTransactionId("");
                    setTimeRemaining(15 * 60);
                  }}
                >
                  Place Another Order
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div >
  );
}
