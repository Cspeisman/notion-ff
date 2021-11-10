interface FeatureGateOptions {
    [key: string]: number;
}

declare module '@teleology/feature-gate' {
    export default function featureGate(options: FeatureGateOptions): (key: string, user: string) => boolean;
}
