import StorefrontProductDetail from "@/components/storefront-product-detail";

export default async function ProductDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StorefrontProductDetail slug={slug} />;
}
