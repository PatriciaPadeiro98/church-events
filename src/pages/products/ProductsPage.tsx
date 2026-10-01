import { useRef } from 'react';
import type { Product } from '../../models/product.types';
import { formatCurrency } from '../../utils/currency';
import { parseProductsCsv, PRODUCTS_CSV_TEMPLATE } from '../../utils/csvImport';

type ProductsPageProps = {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onImportProducts: (products: Omit<Product, 'id'>[], replace: boolean) => void;
};

const downloadFile = (content: string, type: string, filename: string) => {
  const file = new Blob([content], { type });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const ProductsPage = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onImportProducts,
}: ProductsPageProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseProductsCsv(text);

      if (!result.ok) {
        window.alert(`Erro ao importar CSV:\n${result.error}`);
        return;
      }

      const { products: imported } = result;
      const replace = window.confirm(
        `${imported.length} produto(s) encontrado(s).\n\nClicar OK para SUBSTITUIR todos os produtos existentes.\nClicar Cancelar para ADICIONAR aos existentes.`
      );
      onImportProducts(imported, replace);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDownloadTemplate = () => {
    downloadFile(PRODUCTS_CSV_TEMPLATE, 'text/csv;charset=utf-8', 'modelo-produtos.csv');
  };

  return (
    <section className="screen-content">
      <div className="screen-header">
        <h2>Produtos</h2>

        <div className="screen-actions">
          <button onClick={handleDownloadTemplate}>
            ⬇ Modelo CSV
          </button>
          <button onClick={handleImportClick}>
            ⬆ Importar CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="primary-button" onClick={onAddProduct}>
            + Adicionar produto
          </button>
        </div>
      </div>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th className="product-icon-column"></th>
              <th>Produto</th>
              <th>Preço</th>
              <th>Stock inicial</th>
              <th>Stock atual</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => {
              const isLowStock = product.stock <= product.minStock;

              return (
                <tr key={product.id}>
                  <td className="product-icon-column">
                    <div className="product-icon-cell">
                      <span className="product-icon">{product.emoji}</span>
                    </div>
                  </td>
                  <td>
                    <div className="product-name-cell">
                      {product.name}
                    </div>
                  </td>

                  <td>{formatCurrency(product.price)}</td>
                  <td>{product.initialStock}</td>

                  <td>
                    <span
                      className={`stock-pill ${
                        isLowStock ? 'stock-pill-low' : 'stock-pill-ok'
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions">
                      <button onClick={() => onEditProduct(product)}>✎</button>
                      <button onClick={() => onDeleteProduct(product.id)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <p className="table-footer">
          Mostrando {products.length > 0 ? products.length : 0} de {products.length} produtos
        </p>
      </div>
    </section>
  );
};
