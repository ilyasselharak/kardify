import { Skeleton } from "@/components/ui/skeleton";

export function PublicCardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-md px-5 pt-5">
      <Skeleton className="h-80 rounded-[28px]" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
      <Skeleton className="mt-4 h-40 rounded-2xl" />
    </div>
  );
}
