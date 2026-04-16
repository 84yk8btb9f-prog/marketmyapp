import { Suspense } from "react";
import { CheckInContent } from "./check-in-content";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckInContent />
    </Suspense>
  );
}
