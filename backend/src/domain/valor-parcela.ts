import { Decimal } from '@prisma/client/runtime/library';

export function calcularValorParcela(valorCarne: Decimal, numParcelas: number): Decimal {
  return valorCarne.div(numParcelas);
}

export function isDivisaoExata(valorCarne: Decimal, numParcelas: number): boolean {
  return valorCarne.mod(numParcelas).equals(0);
}
