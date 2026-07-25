import { notFound } from "next/navigation";
import { libraryRepository } from "@backend/modules/library/server/repository";
import CollectionEditor from "@/modules/studio/components/CollectionEditor";

export default async function EditCollectionPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const collection = libraryRepository.getCollectionById((await params).id, true);
  if (!collection || collection.deletedAt) notFound();
  return <CollectionEditor initial={collection} />;
}
