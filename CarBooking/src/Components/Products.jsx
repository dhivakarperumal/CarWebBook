import React, { useEffect, useState } from "react";
import api from "../api";
import PageContainer from "./PageContainer";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";
import { FiShoppingCart } from "react-icons/fi";
import PageHeader from "./PageHeader";
import toast from "react-hot-toast";
import ProductCard from "./ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");

        const activeProducts = (res.data || []).filter(
          (p) => p.isActive === 1 || p.isActive === true,
        );

        setProducts(activeProducts);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product, e) => {
    e.stopPropagation();

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!product.totalStock || product.totalStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    const variant = product.variants?.[0];

    if (!variant?.sku) {
      toast.error("Invalid product variant");
      return;
    }

    try {
      await api.post("/cart/add", {
        userId: user.id || null,
        userUid: user.uid || null,
        productId: product.docId,
        sku: variant.sku,
        name: product.name,
        price: Number(product.offerPrice) || 0,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : product.thumbnail || "",
        quantity: 1,
      });

      window.dispatchEvent(new Event("cart-updated"));
      toast.success("Added to cart!");
    } catch (err) {
      console.error("Cart error", err);
      toast.error("Error adding to cart");
    }
  };

  return (
    <>
      <PageHeader title="Our Products" />
      <section className="bg-black py-24">
        <PageContainer>
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.docId}
                product={product}
                handleAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </PageContainer>
      </section>
    </>
  );
}
