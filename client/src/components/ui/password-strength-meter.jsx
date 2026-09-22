// components/ui/password-strength-meter.jsx
export const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = () => {
    if (!password) return 0;
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    // Character diversity
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return Math.min(strength, 5); // Max strength of 5
  };

  const strength = calculateStrength();
  const strengthText = [
    "Very Weak",
    "Weak",
    "Moderate",
    "Strong",
    "Very Strong",
  ][strength] || "";

  const getColor = () => {
    if (strength <= 1) return "bg-red-500";
    if (strength <= 2) return "bg-orange-500";
    if (strength <= 3) return "bg-yellow-500";
    if (strength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  return (
    <div className="mt-2 space-y-1">
      <div className="flex h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-full ${i < strength ? getColor() : "bg-gray-200"}`}
            style={{ width: "20%" }}
          />
        ))}
      </div>
      {password && (
        <p className="text-base text-gray-500">
          Strength: <span className="font-extralight">{strengthText}</span>
        </p>
      )}
    </div>
  );
};