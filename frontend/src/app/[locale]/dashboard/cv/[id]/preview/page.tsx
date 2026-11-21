import { Suspense } from "react";
import { CvOwnerPreview } from "@/components/cv/cv-owner-preview";

export default function Page() {
  return (
    <Suspense>
      <CvOwnerPreview />
    </Suspense>
  );
}
