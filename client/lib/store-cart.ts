export type StoreCartItem = {
  productId: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
};

const CART_KEY = "storefront-cart";
const CART_EVENT = "storefront-cart-change";

export function getStoreCart(): StoreCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is StoreCartItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.productId === "string" && typeof candidate.name === "string" &&
        typeof candidate.price === "number" && Number.isFinite(candidate.price) &&
        typeof candidate.quantity === "number" && Number.isFinite(candidate.quantity);
    });
  } catch {
    return [];
  }
}

function saveStoreCart(items: StoreCartItem[]) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addStoreCartItem(product: { id: string; name: string; price: number; imageUrl?: string | null }, quantity = 1) {
  const items = getStoreCart();
  const existing = items.find((item) => item.productId === product.id);
  if (existing) existing.quantity += quantity;
  else items.push({ productId: product.id, name: product.name, price: Number(product.price), imageUrl: product.imageUrl, quantity });
  saveStoreCart(items);
}

export function removeStoreCartItem(productId: string) {
  saveStoreCart(getStoreCart().filter((item) => item.productId !== productId));
}

export function clearStoreCart() {
  saveStoreCart([]);
}

export function setStoreCartQuantity(productId: string, quantity: number) {
  const items = getStoreCart();
  if (quantity <= 0) {
    saveStoreCart(items.filter((item) => item.productId !== productId));
    return;
  }
  saveStoreCart(items.map((item) => item.productId === productId ? { ...item, quantity } : item));
}

export const storeCartEventName = CART_EVENT;
