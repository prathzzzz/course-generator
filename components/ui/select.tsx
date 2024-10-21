import React from 'react'

export const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props}>{children}</select>
)

export const SelectTrigger = Select

export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const SelectItem = ({ children, ...props }: React.OptionHTMLAttributes<HTMLOptionElement>) => (
  <option {...props}>{children}</option>
)

export const SelectValue = ({ placeholder }: { placeholder?: string }) => <option value="">{placeholder}</option>
