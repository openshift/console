
export const isArgoCDResource = (metadata) : boolean => {
    const isArgoCDCondition1 = (metadata?.annotations && metadata?.annotations['argocd.argoproj.io/tracking-id'] !== undefined) ? true : false; // For Argo CD 3.0
    const isArgoCDCondition2 = (metadata?.labels && metadata?.labels['app.kubernetes.io/managed-by'] === 'argocd') ? true : false;
    return isArgoCDCondition1 || isArgoCDCondition2;
}
