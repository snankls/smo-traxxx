import { notFound } from "next/navigation";
import DataPage from "@/components/DataPage";
import RightsPage from "@/components/RightsPage";
import { PAGE_DEFS } from "@/lib/pages";

export function generateStaticParams() {
  return Object.keys(PAGE_DEFS).map((key) => {
    const [group, slug] = key.split("/");
    return { group, slug };
  });
}

export default function Page({ params }: { params: { group: string; slug: string } }) {
  const key = `${params.group}/${params.slug}`;
  const def = PAGE_DEFS[key];
  if (!def) notFound();
  if (key === "users/rights") return <RightsPage />;
  return <DataPage key={key} def={def} />;
}
