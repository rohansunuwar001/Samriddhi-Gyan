import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PaymentFailed() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <XCircle className="mx-auto text-red-500 w-16 h-16" />

        <h1 className="text-4xl font-semibold mt-5">Payment Failed</h1>

        <p className="mt-3 text-gray-500">Your payment was not completed.</p>

        <div className="mt-6">
          <Link to="/cart">
            <Button>Return to Cart</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
