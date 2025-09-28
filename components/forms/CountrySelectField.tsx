"use client"

import { useState, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import countryList from 'react-select-country-list'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
import ReactCountryFlag from 'react-country-flag'

/**
 * Componente de campo de formulario para seleccionar un país con búsqueda.
 * Se integra con `react-hook-form` y utiliza `shadcn/ui` para la interfaz.
 * @param {CountrySelectProps} props - Propiedades para configurar el campo.
 * @param {Control} props.control    - Objeto `control` de `react-hook-form`.
 * @param {string} props.name        - Nombre del campo en el formulario.
 * @param {string} props.label       - Etiqueta visible para el campo.
 * @param {FieldError} [props.error] - Objeto de error de `react-hook-form` si la validación falla.
 */
const CountrySelectField = ({ control, name, label, error }: CountrySelectProps) => {
  
  // Estado para controlar la visibilidad del Popover (menú desplegable).
  const [open, setOpen] = useState(false);                           // Estado para controlar la visibilidad del Popover (menú desplegable).
  const options = useMemo(() => countryList().getData(), [])         // Memoriza la lista de países para evitar recalcularla en cada renderizado.

  return (
    <div className="space-y-2">
      {/* Etiqueta del campo, mejora la accesibilidad con `htmlFor`. */}
      <Label htmlFor={name} className="form-label">{label}</Label>      
      
      {/* Controller integra el campo con `react-hook-form` para manejar su estado y validación. */}
      <Controller
        name={name}                                                 // Nombre del campo en el formulario.
        control={control}                                           // Controla el estado del campo.
        rules={{ required: 'Country is required' }}                 // Regla de validación: el campo es obligatorio.
        render={({ field }) => (
          // Componente Popover que actúa como contenedor del menú desplegable.
          <Popover open={open} onOpenChange={setOpen}>
            {/* El botón que abre y cierra el Popover. */}
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  // Clases condicionales: muestra el texto como placeholder si no hay valor.
                  "select-trigger w-full justify-between",
                  !field.value && "text-muted-foreground"
                )}
              >
                {/* Muestra el nombre del país seleccionado o un texto de placeholder. */}
                {field.value ? (
                  <span className="flex items-center gap-2">
                    <ReactCountryFlag countryCode={field.value} svg style={{ width: '1.5em', height: '1.5em' }} />
                    {
                      options.find((country) => country.value === field.value)?.label
                    }
                  </span>
                ) : "Select country"}
                {/* Icono que indica que el campo es un desplegable. */}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            {/* Contenido del Popover, que aparece al abrirlo. */}
            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
              {/* Componente de `shadcn/ui` que habilita la funcionalidad de búsqueda. */}
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((country) => (
                      // Cada país es un item seleccionable en la lista.
                      <CommandItem
                        key={country.value}
                        value={country.label}
                        onSelect={() => {
                          // Actualiza el valor en react-hook-form y cierra el popover.
                          field.onChange(country.value)
                          setOpen(false)
                        }}
                      >
                        {/* Icono de check para indicar el país seleccionado. */}
                        <Check className={cn("mr-2 h-4 w-4", field.value === country.value ? "opacity-100" : "opacity-0")} />
                        <ReactCountryFlag 
                          countryCode={country.value} 
                          svg 
                          style={{ 
                            width: '1.5em', 
                            height: '1.5em', 
                            marginRight: '0.5rem' 
                          }} 
                        />
                        <span>
                          {country.label}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />
      {/* Muestra un mensaje de error si la validación del formulario falla. */}
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default CountrySelectField