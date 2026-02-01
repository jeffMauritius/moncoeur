const ZEPTOMAIL_API_KEY = process.env.ZEPTOMAIL_API_KEY;
const ZEPTOMAIL_FROM_EMAIL = process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@moncoeur.app";
const ZEPTOMAIL_FROM_NAME = "MonCoeur";

interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!ZEPTOMAIL_API_KEY) {
    console.warn("ZeptoMail API key not configured, skipping email");
    return false;
  }

  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch("https://api.zeptomail.eu/v1.1/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": ZEPTOMAIL_API_KEY,
      },
      body: JSON.stringify({
        from: {
          address: ZEPTOMAIL_FROM_EMAIL,
          name: ZEPTOMAIL_FROM_NAME,
        },
        to: recipients.map((email) => ({
          email_address: {
            address: email,
          },
        })),
        subject: options.subject,
        htmlbody: options.htmlBody,
        textbody: options.textBody || stripHtml(options.htmlBody),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("ZeptoMail error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

// Email templates
export function newBagNotificationEmail(bag: {
  reference: string;
  brand: string;
  model: string;
  purchasePrice: number;
  createdByName: string;
}): EmailOptions {
  return {
    to: [], // Will be filled with admin emails
    subject: `[MonCoeur] Nouveau sac enregistre: ${bag.brand} ${bag.model}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f472b6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MonCoeur</h1>
        </div>
        <div style="padding: 20px; background-color: #fdf2f8;">
          <h2 style="color: #be185d;">Nouveau sac enregistre</h2>
          <p>Un nouveau sac a ete ajoute au stock par <strong>${bag.createdByName}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;"><strong>Reference</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;">${bag.reference}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;"><strong>Marque</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;">${bag.brand}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;"><strong>Modele</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;">${bag.model}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;"><strong>Prix d'achat</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fce7f3;">${bag.purchasePrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
            </tr>
          </table>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Cet email a ete envoye automatiquement par MonCoeur.</p>
        </div>
      </div>
    `,
  };
}

export function saleNotificationEmail(sale: {
  bagReference: string;
  bagBrand: string;
  bagModel: string;
  salePrice: number;
  margin: number;
  marginPercent: number;
  soldByName: string;
}): EmailOptions {
  const marginColor = sale.margin >= 0 ? "#16a34a" : "#dc2626";

  return {
    to: [], // Will be filled with admin emails
    subject: `[MonCoeur] Vente realisee: ${sale.bagBrand} ${sale.bagModel} - Marge: ${sale.margin.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f472b6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MonCoeur</h1>
        </div>
        <div style="padding: 20px; background-color: #f0fdf4;">
          <h2 style="color: #15803d;">Vente realisee</h2>
          <p>Une vente a ete enregistree par <strong>${sale.soldByName}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;"><strong>Reference</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;">${sale.bagReference}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;"><strong>Sac</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;">${sale.bagBrand} - ${sale.bagModel}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;"><strong>Prix de vente</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;">${sale.salePrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7;"><strong>Marge</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #dcfce7; color: ${marginColor}; font-weight: bold;">
                ${sale.margin >= 0 ? "+" : ""}${sale.margin.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                (${sale.marginPercent.toFixed(1)}%)
              </td>
            </tr>
          </table>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Cet email a ete envoye automatiquement par MonCoeur.</p>
        </div>
      </div>
    `,
  };
}

export function weeklyReportEmail(stats: {
  totalRevenue: number;
  totalMargin: number;
  salesCount: number;
  newBagsCount: number;
  topBrands: { brand: string; revenue: number; count: number }[];
}): EmailOptions {
  const topBrandsHtml = stats.topBrands
    .map(
      (b, i) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${i + 1}. ${b.brand}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${b.count} vente(s)</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${b.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</td>
        </tr>`
    )
    .join("");

  return {
    to: [], // Will be filled with admin emails
    subject: `[MonCoeur] Rapport hebdomadaire - CA: ${stats.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f472b6; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">MonCoeur</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #be185d;">Rapport Hebdomadaire</h2>

          <div style="display: flex; gap: 20px; margin: 20px 0;">
            <div style="flex: 1; background-color: #fdf2f8; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #be185d;">
                ${stats.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </p>
              <p style="margin: 5px 0 0; color: #9ca3af; font-size: 12px;">Chiffre d'affaires</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Marge totale</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: ${stats.totalMargin >= 0 ? "#16a34a" : "#dc2626"};">
                ${stats.totalMargin >= 0 ? "+" : ""}${stats.totalMargin.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nombre de ventes</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${stats.salesCount}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nouveaux sacs en stock</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${stats.newBagsCount}</td>
            </tr>
          </table>

          ${stats.topBrands.length > 0 ? `
            <h3 style="color: #be185d;">Top Marques</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #fdf2f8;">
                  <th style="padding: 8px; text-align: left;">Marque</th>
                  <th style="padding: 8px; text-align: left;">Ventes</th>
                  <th style="padding: 8px; text-align: left;">CA</th>
                </tr>
              </thead>
              <tbody>
                ${topBrandsHtml}
              </tbody>
            </table>
          ` : ""}
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>Cet email a ete envoye automatiquement par MonCoeur.</p>
        </div>
      </div>
    `,
  };
}
