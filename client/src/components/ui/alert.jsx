import * as React from "react";

const Alert = React.forwardRef(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-lg border px-4 py-3 text-base ${
          variant === "destructive"
            ? "bg-red-100 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300"
            : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300"
        } ${className}`}
        {...props}
      />
    );
  }
);

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={`mb-1 font-light leading-none tracking-tight ${className}`}
    {...props}
  />
));

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-base [&_p]:leading-relaxed ${className}`}
    {...props}
  />
));

export { Alert, AlertTitle, AlertDescription };
