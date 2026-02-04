import { LoaderCircle } from "lucide-react";
import React from "react";

function LoaderSpiner({
  size = 24,
  className = "text-primary",
}: {
  size?: number;
  className?: string;
}) {
  return <LoaderCircle size={size} className={` animate-spin ${className}`} />;
}

export default LoaderSpiner;
