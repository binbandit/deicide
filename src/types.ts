export interface PackageInfo {
  name: string;
  path: string;
  relativePath: string;
  dependencies: string[];
}

export interface TsConfig {
  compilerOptions: {
    [key: string]: any;
  };
  references?: { path: string }[];
  include?: string[];
  exclude?: string[];
}
