/**
 * Empresa proveniente de [ECS_BD].[Empresarial].[EMP_Empresas].
 * Coincide con la entidad EF EmpEmpresa.
 */
export interface Empresa {
  idEmpresa: number;
  guidEmpresa: string;
  razonSocial: string;
  nombreComercial?: string | null;
  baseDeDatos?: string | null;
  rfc?: string | null;
  estaActivo?: boolean | null;
}
