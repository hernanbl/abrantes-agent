
import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-2 text-center text-xs text-gray-600 border-t border-gray-200 mt-auto">
      <div className="flex justify-center items-center">
        <span className="flex items-center">
          Desarrollado para Abrantes S.A. por
          <a 
            href="https://vivacom.com.ar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 flex items-center"
          >
            <img 
              src="/lovable-uploads/bfaf2344-c43d-42e7-8dac-fc27b9c2afaa.png" 
              alt="Vivacom" 
              className="h-4 ml-1" 
            />
          </a>
        </span>
      </div>
    </footer>
  );
}
