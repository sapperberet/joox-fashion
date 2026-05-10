import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}

// Mock function to simulate fetching most sold products
const fetchMostSoldProducts = async (): Promise<Product[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: '1',
          name: 'Classic T-Shirt',
          imageUrl: '/joox-fashion.png',
          price: 19.99,
        },
        {
          id: '2',
          name: 'Denim Jeans',
          imageUrl: '/joox-fashion.png',
          price: 49.99,
        },
        {
          id: '3',
          name: 'Summer Dress',
          imageUrl: '/joox-fashion.png',
          price: 34.50,
        },
        {
          id: '4',
          name: 'Leather Jacket',
          imageUrl: '/joox-fashion.png',
          price: 120.00,
        },
        {
          id: '5',
          name: 'Sport Shoes',
          imageUrl: '/joox-fashion.png',
          price: 75.00,
        },
      ]);
    }, 1000);
  });
};

const MostSoldProductsCarousel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const getProducts = async () => {
      const data = await fetchMostSoldProducts();
      setProducts(data);
    };
    getProducts();
  }, []);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="w-full py-8 overflow-hidden">
      <h2 className="text-2xl font-bold text-center mb-6">Most Sold Products</h2>
      <div className="flex animate-carousel">
        {products.map((product) => (
          <div key={product.id} className="shrink-0 w-64 mx-4">
            <Link href={`/product/${product.id}`}>
              <a className="block">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                  />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-gray-800">{product.name}</h3>
                <p className="text-gray-600">${product.price.toFixed(2)}</p>
              </a>
            </Link>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes carousel {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-carousel {
          animation: carousel 20s linear infinite;
          width: max-content;
        }
        .animate-carousel:hover {
            animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default MostSoldProductsCarousel;
