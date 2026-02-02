import type { ColumnDef } from "@tanstack/table-core";
import { createRawSnippet } from "svelte";
import { renderSnippet } from "$lib/components/ui/data-table/index.js";
import { renderComponent } from "$lib/components/ui/data-table/index.js";
import ActionCell from "$lib/components/ui/data-table/ActionCell.svelte";
import ModifyButton from "$lib/components/ModifyButton.svelte";

/**
 * Formate un nombre en insérant un séparateur de milliers personnalisé.
 * @param num Le nombre à formater
 * @param separator Le texte à insérer (ex: '  ' ou ' _ ')
 */
function formatNumber(num: number, separator: string = "  "): string {
  const numStr = num.toString();
  const parts = numStr.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1] : "";
  const integerPartFormatted = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    separator
  );
  return integerPartFormatted + decimalPart;
}

const categoryLabels: { [key: string]: string } = {
  tous: "Tous",
  ames: "Âmes",
  equipements: "Équipements",
  consommables: "Consommables",
  creatures: "Créatures",
  cosmetiques: "Cosmétiques",
  runes: "Runes",
};

export type Item = {
  id: number;
  nom: string;
  category: string;
  prixAchat: number;
  unit: number;
  size: number; // C'est ce champ qui détermine la quantité (x1, x10, x100...)
  prixVente: number | null;
  benefit: number;
  statusVente: boolean;
  createdAt: Date;
  imageUrl?: string | null;
  type?: string | null;
  superType?: string | null;
};

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "nom",
    header: "Nom",
    cell: ({ row }) => {
      const name = row.original.nom;
      const img = row.original.imageUrl;

      const snippet = createRawSnippet<
        [{ name: string; img: string | null | undefined }]
      >((getData) => {
        const { name, img } = getData();
        const imgHtml = img
          ? `<img src="${img}" alt="${name}" class="w-8 h-8 mr-3 rounded-md object-contain" />`
          : "";

        return {
          render: () =>
            `<div class="flex items-center">${imgHtml}<span class="font-medium">${name}</span></div>`,
        };
      });

      return renderSnippet(snippet, { name, img });
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie",
    cell: ({ row }) => {
      const categoryValue = row.original.category;
      return categoryLabels[categoryValue] || categoryValue;
    },
  },
  // --- MODIFICATION PRIX ACHAT ---
  {
    accessorKey: "prixAchat",
    header: "Prix d'Achat",
    cell: ({ row }) => {
      const price = row.original.prixAchat;
      const size = row.original.size;
      const formattedTotal = formatNumber(price);

      // Calcul du prix unitaire si la taille est supérieure à 1
      let formattedUnit = "";
      if (size > 1) {
        const unitPrice = Math.round(price / size);
        formattedUnit = formatNumber(unitPrice);
      }

      const snippet = createRawSnippet<
        [{ total: string; unitPrice: string; size: number }]
      >((getData) => {
        const { total, unitPrice, size } = getData();

        // Si size > 1, on affiche la ligne du dessous
        const unitHtml =
          size > 1
            ? `<div class="text-xs text-gray-500 font-normal mt-0.5">Unité : ${unitPrice}</div>`
            : "";

        return {
          render: () =>
            `<div class="flex flex-col">
                            <div class="text-red-500 font-medium flex flex-row items-center gap-1">
                                ${total} <img class="size-3.5" src="/Kama.png" alt="Kama">
                            </div>
                            ${unitHtml}
                        </div>`,
        };
      });

      return renderSnippet(snippet, {
        total: formattedTotal,
        unitPrice: formattedUnit,
        size,
      });
    },
  },
  // --- PRIX PROPOSÉ (ROI 30%) ---
  {
    accessorKey: "prixPropose",
    header: "Prix Proposé",
    cell: ({ row }) => {
      const prixAchat = row.original.prixAchat;
      const size = row.original.size;

      // Calcul du prix proposé avec ROI de 30%
      const prixPropose = Math.round(prixAchat * 1.3);
      const formattedTotal = formatNumber(prixPropose);

      let formattedUnit = "";
      if (size > 1) {
        const unitPrice = Math.round(prixPropose / size);
        formattedUnit = formatNumber(unitPrice);
      }

      const snippet = createRawSnippet<
        [{ total: string; unitPrice: string; size: number }]
      >((getData) => {
        const { total, unitPrice, size } = getData();

        const unitHtml =
          size > 1
            ? `<div class="text-xs text-gray-500 font-normal mt-0.5">Unité : ${unitPrice}</div>`
            : "";

        return {
          render: () =>
            `<div class="flex flex-col">
                            <div class="text-amber-600 font-medium flex flex-row items-center gap-1">
                                ${total} <img class="size-3.5" src="/Kama.png" alt="Kama">
                                <span class="text-xs text-gray-500 ml-1">(+30%)</span>
                            </div>
                            ${unitHtml}
                        </div>`,
        };
      });

      return renderSnippet(snippet, {
        total: formattedTotal,
        unitPrice: formattedUnit,
        size,
      });
    },
  },
  // --- MODIFICATION PRIX VENTE ---
  {
    accessorKey: "prixVente",
    header: "Prix de Vente",
    cell: ({ row }) => {
      const price = row.original.prixVente;
      const size = row.original.size;

      // Gestion du cas où le prix est null
      const formattedTotal = price !== null ? formatNumber(price) : "-";

      let formattedUnit = "";
      if (price !== null && size > 1) {
        const unitPrice = Math.round(price / size);
        formattedUnit = formatNumber(unitPrice);
      }

      const snippet = createRawSnippet<
        [{ total: string; unitPrice: string; size: number; hasPrice: boolean }]
      >((getData) => {
        const { total, unitPrice, size, hasPrice } = getData();

        const unitHtml =
          hasPrice && size > 1
            ? `<div class="text-xs text-gray-500 font-normal mt-0.5">Unité : ${unitPrice}</div>`
            : "";

        return {
          render: () =>
            `<div class="flex flex-col">
                            <div class="text-emerald-600 font-medium flex flex-row items-center gap-1">
                                ${total} <img class="size-3.5" src="/Kama.png" alt="Kama">
                            </div>
                            ${unitHtml}
                        </div>`,
        };
      });

      return renderSnippet(snippet, {
        total: formattedTotal,
        unitPrice: formattedUnit,
        size,
        hasPrice: price !== null,
      });
    },
  },
  {
    accessorKey: "benefit",
    header: "Bénéfice",
    cell: ({ row }) => {
      const benefit = row.original.benefit;
      const formatted = formatNumber(benefit);

      const snippet = createRawSnippet<[{ b: number; f: string }]>(
        (getData) => {
          const { b, f } = getData();
          let colorClass = "";
          if (b > 0) {
            colorClass = "text-emerald-600";
          } else if (b < 0) {
            colorClass = "text-red-500";
          }
          return {
            render: () =>
              `<div class="${colorClass} font-medium flex flex-row items-center gap-1">${f} <img class="size-3.5" src="/Kama.png" alt="Kama"></div>`,
          };
        }
      );

      return renderSnippet(snippet, { b: benefit, f: formatted });
    },
  },
  {
    accessorKey: "statusVente",
    header: "Statut",
    cell: ({ row }) => {
      const badgeSnippet = createRawSnippet<[{ isSold: boolean }]>(
        (getData) => {
          const { isSold } = getData();
          const text = isSold ? "Vendu" : "Disponible";

          const baseClasses =
            "inline-flex justify-center items-center rounded-full border w-20 px-2.5 py-1 text-xs font-semibold transition-colors";

          const variantClasses = isSold
            ? "border-transparent bg-emerald-500 text-white"
            : "border-transparent bg-secondary text-secondary-foreground";

          return {
            render: () =>
              `<div class="${baseClasses} ${variantClasses}">${text}</div>`,
          };
        }
      );

      return renderSnippet(badgeSnippet, {
        isSold: row.original.statusVente,
      });
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      return renderComponent(ActionCell, {
        id: row.original.id,
        isSold: row.original.statusVente,
        object: row.original,
      });
    },
  },
];
