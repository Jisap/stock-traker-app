import React from 'react'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Componente reutilizable para un campo de entrada de formulario.
 * Se integra con react-hook-form para el registro y la validación.
 * @param {FormInputProps} props - Propiedades para configurar el campo de entrada.
 */

const InputField = ({ 
  name, 
  label, 
  placeholder, 
  type = "text", 
  register, 
  error, 
  validation, 
  disabled, 
  value 
}: FormInputProps) => {
  
  return (
    // Contenedor principal que agrupa la etiqueta, el input y el mensaje de error.
    <div className="space-y-2">
      {/* Etiqueta del campo de entrada. `htmlFor` mejora la accesibilidad. */}
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>

      {/* Componente de entrada de shadcn/ui. */}
      <Input
        type={type}
        id={name}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        // `cn` combina clases de forma condicional para el estado deshabilitado.
        className={cn('form-input', { 'opacity-50 cursor-not-allowed': disabled })}
        // Registra el input en react-hook-form y aplica las reglas de validación.
        {...register(name, validation)}
      />

      {/* Muestra un mensaje de error si la validación falla. */}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}
export default InputField