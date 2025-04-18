export function generateLinkRekap(userId: string, bulan: string) {
    const baseUrl = 'http://localhost:3001'; // ganti ini dengan domain kamu
    return `${baseUrl}/rekap/${userId}/${bulan}`;
  }
  