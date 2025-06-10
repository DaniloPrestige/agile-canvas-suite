
interface ExchangeRates {
  [key: string]: number;
}

class CurrencyService {
  private static instance: CurrencyService;
  private exchangeRates: ExchangeRates = {};
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  private constructor() {}

  static getInstance(): CurrencyService {
    if (!CurrencyService.instance) {
      CurrencyService.instance = new CurrencyService();
    }
    return CurrencyService.instance;
  }

  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    // Se os dados estão em cache e são recentes, retorna o cache
    if (this.exchangeRates && Object.keys(this.exchangeRates).length > 0 && 
        (now - this.lastUpdate) < this.CACHE_DURATION) {
      console.log('Usando taxas de câmbio do cache:', this.exchangeRates);
      return this.exchangeRates;
    }

    console.log('Buscando novas taxas de câmbio...');

    try {
      // Usando API gratuita e confiável
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Resposta da API de câmbio:', data);
        
        if (data && data.rates) {
          this.exchangeRates = {
            USD: 1,
            BRL: data.rates.BRL || 5.0,
            EUR: data.rates.EUR || 0.85
          };
          this.lastUpdate = now;
          console.log('Taxas de câmbio atualizadas:', this.exchangeRates);
        } else {
          throw new Error('Formato de resposta da API inválido');
        }
      } else {
        throw new Error(`API response status: ${response.status}`);
      }
    } catch (error) {
      console.warn('Erro ao buscar taxas de câmbio, usando valores padrão:', error);
      // Valores padrão atualizados
      this.exchangeRates = {
        USD: 1,
        BRL: 5.2,
        EUR: 0.92
      };
      this.lastUpdate = now;
      console.log('Usando taxas padrão:', this.exchangeRates);
    }

    return this.exchangeRates;
  }

  async convertCurrency(amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): Promise<number> {
    console.log(`Convertendo ${amount} de ${fromCurrency} para ${toCurrency}`);
    
    if (fromCurrency === toCurrency) {
      console.log('Moedas iguais, retornando valor original');
      return amount;
    }

    const rates = await this.getExchangeRates();
    console.log('Taxas para conversão:', rates);
    
    try {
      // Converte primeiro para USD como base
      const amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
      console.log(`Valor em USD: ${amountInUSD}`);
      
      // Depois converte de USD para a moeda de destino
      const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency];
      console.log(`Valor convertido: ${convertedAmount}`);
      
      const finalAmount = Math.round(convertedAmount * 100) / 100; // Arredonda para 2 casas decimais
      console.log(`Valor final: ${finalAmount}`);
      
      return finalAmount;
    } catch (error) {
      console.error('Erro na conversão de moedas:', error);
      return amount; // Retorna o valor original em caso de erro
    }
  }
}

export const currencyService = CurrencyService.getInstance();
