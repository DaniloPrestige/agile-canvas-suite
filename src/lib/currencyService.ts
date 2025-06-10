
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
      return this.exchangeRates;
    }

    try {
      // Usando API alternativa mais confiável
      const response = await fetch('https://api.fxratesapi.com/latest?base=USD&symbols=BRL,EUR', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.rates) {
          this.exchangeRates = {
            USD: 1,
            BRL: data.rates.BRL || 5.0,
            EUR: data.rates.EUR || 0.85
          };
          this.lastUpdate = now;
          console.log('Taxas de câmbio atualizadas:', this.exchangeRates);
        }
      } else {
        throw new Error('API response not ok');
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
    }

    return this.exchangeRates;
  }

  async convertCurrency(amount: number, fromCurrency: 'BRL' | 'USD' | 'EUR', toCurrency: 'BRL' | 'USD' | 'EUR'): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    
    try {
      // Converte primeiro para USD como base
      const amountInUSD = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
      
      // Depois converte de USD para a moeda de destino
      const convertedAmount = toCurrency === 'USD' ? amountInUSD : amountInUSD * rates[toCurrency];
      
      return Math.round(convertedAmount * 100) / 100; // Arredonda para 2 casas decimais
    } catch (error) {
      console.error('Erro na conversão de moedas:', error);
      return amount; // Retorna o valor original em caso de erro
    }
  }
}

export const currencyService = CurrencyService.getInstance();
