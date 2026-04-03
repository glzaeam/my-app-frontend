export const useToast = () => {
  const toast = ({ title, description }: { title: string; description: string }) => {
    console.log(`[${title}] ${description}`);
    // Simple implementation - logs to console
    // You can extend this to show actual toast notifications
  };

  return { toast };
};
