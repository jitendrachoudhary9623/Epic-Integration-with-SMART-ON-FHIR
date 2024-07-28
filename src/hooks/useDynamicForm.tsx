'use client';

import React, { useCallback } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputField from '@/components/elements/InputField';

type ValidationRule = {
  type: string;
  params?: any;
  message: string;
};

type FormField = {
  fieldname?: string;
  label?: string;
  fieldtype: string;
  reqd?: number;
  options?: string[] | string;
  validations?: ValidationRule[];
  collapsible?: number;
  collapsible_depends_on?: string;
  depends_on?: string;
  non_negative?: number;
  default?: string;
};

type FormSchema = {
  fields: FormField[];
};

const createZodSchema = (formSchema: FormSchema) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  formSchema.fields.forEach((field) => {
    if (field.fieldname) {
      let fieldSchema: z.ZodTypeAny;

      switch (field.fieldtype) {
        case 'Select':
        case 'Link':
          fieldSchema = z.enum(field.options as [string, ...string[]], {
            required_error: `${field.label} is required`,
          });
          break;
        case 'Date':
          fieldSchema = z.string().refine((date) => {
            const parsed = new Date(date);
            return !isNaN(parsed.getTime());
          }, { message: `Invalid date for ${field.label}` });
          break;
        case 'Currency':
          let currencySchema = z.number({
            required_error: `${field.label} is required`,
            invalid_type_error: `${field.label} must be a number`,
          });
          if (field.non_negative) {
            currencySchema = currencySchema.min(0, `${field.label} must be non-negative`);
          }
          fieldSchema = currencySchema;
          break;
        case 'Text Editor':
          fieldSchema = z.string();
          break;
        default:
          fieldSchema = z.string();
      }

      if (field.reqd) {
        if (fieldSchema instanceof z.ZodString || fieldSchema instanceof z.ZodNumber) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`);
        } else if (!(fieldSchema instanceof z.ZodEnum)) {
          fieldSchema = fieldSchema.nullish().refine((val) => val !== null && val !== undefined, {
            message: `${field.label} is required`,
          });
        }
      } else {
        fieldSchema = fieldSchema.optional();
      }

      if (field.validations) {
        field.validations.forEach((rule) => {
          switch (rule.type) {
            case 'max':
              if (fieldSchema instanceof z.ZodString || fieldSchema instanceof z.ZodNumber) {
                fieldSchema = fieldSchema.max(rule.params, rule.message);
              }
              break;
            case 'min':
              if (fieldSchema instanceof z.ZodString || fieldSchema instanceof z.ZodNumber) {
                fieldSchema = fieldSchema.min(rule.params, rule.message);
              }
              break;
            case 'email':
              console.log('fieldSchema:', "email",fieldSchema instanceof z.ZodString);
              if (fieldSchema instanceof z.ZodString) {
                fieldSchema = fieldSchema.email(rule.message);
              }
              break;
            case 'regex':
              if (fieldSchema instanceof z.ZodString) {
                fieldSchema = fieldSchema.regex(new RegExp(rule.params), rule.message);
              }
              break;
            case 'custom':
              fieldSchema = fieldSchema.refine(
                new Function('value', `return (${rule.params})(value)`) as (value: any) => boolean,
                { message: rule.message }
              );
              break;
          }
        });
      }

      schemaFields[field.fieldname] = fieldSchema;
    }
  });

  return z.object(schemaFields);
};

const useDynamicForm = (formSchema: FormSchema) => {
  const zodSchema = createZodSchema(formSchema);
  const { control, handleSubmit, reset, formState } = useForm({
    resolver: zodResolver(zodSchema),
    mode: 'onChange'
  });

  const renderFields = useCallback(() => {
    const sections: React.ReactNode[] = [];
    let currentSection: React.ReactNode[] = [];
    let currentRow: React.ReactNode[] = [];
    let columnsInCurrentRow = 0;
    let totalColumns = 4; // Default to 4 columns

    const startNewRow = () => {
      if (currentRow.length > 0) {
        currentSection.push(
          <div key={`row-${currentSection.length}`} className={`grid grid-cols-${totalColumns} gap-4`}>
            {currentRow}
          </div>
        );
        currentRow = [];
        columnsInCurrentRow = 0;
        totalColumns = 4; // Reset to default for the next row
      }
    };

    const startNewSection = (label?: string) => {
      startNewRow();
      if (currentSection.length > 0 || label) {
        sections.push(
          <div key={`section-${sections.length}`} className="mb-6">
            {label && (
              <div className="col-span-full mt-6 mb-4">
                <h3 className="text-lg font-semibold">{label}</h3>
                <hr className="my-2" />
              </div>
            )}
            {currentSection}
          </div>
        );
        currentSection = [];
      }
    };

    const getOptions = (field: FormField) => {
      if (field.fieldtype === 'Select' || field.fieldtype === 'Link') {
        if (Array.isArray(field.options)) {
          return field.options.map(opt => ({ value: opt, label: opt }));
        } else if (typeof field.options === 'string') {
          return field.options.split('\n').filter(Boolean).map(opt => ({ value: opt, label: opt }));
        }
      }
      return undefined;
    };

    formSchema.fields.forEach((field, index) => {
      switch (field.fieldtype) {
        case 'Section Break':
          startNewSection(field.label);
          break;
        case 'Column Break':
          columnsInCurrentRow++;
          totalColumns = Math.max(totalColumns, columnsInCurrentRow);
          break;
        default:
          const colSpan = field.fieldtype === 'Text Editor' ? totalColumns : 1;
          if (columnsInCurrentRow + colSpan > totalColumns) {
            startNewRow();
          }
          const renderedField = (
            <div key={field.fieldname || `field-${index}`} className={`col-span-${colSpan}`}>
              <InputField
                control={control}
                name={field.fieldname!}
                label={field.label!}
                type={
                  field.fieldtype === 'Date' ? 'date' :
                  field.fieldtype === 'Text Editor' ? 'textarea' :
                  field.fieldtype === 'Currency' ? 'number' :
                  field.fieldtype === 'Select' || field.fieldtype === 'Link' ? 'select' :
                  'text'
                }
                required={!!field.reqd}
                options={getOptions(field)}
                errors={formState.errors}
              />
            </div>
          );
          currentRow.push(renderedField);
          columnsInCurrentRow += colSpan;
          break;
      }
    });

    startNewSection(); // Ensure any remaining fields are added

    return <div className="w-full space-y-4">{sections}</div>;
  }, [formSchema, control, formState.errors]);

  return {
    control,
    handleSubmit,
    reset,
    formState,
    renderFields,
  };
};

export default useDynamicForm;
