import { t } from '../../i18n';
import { ServiceError } from '../contracts';

/**
 * Validation errors that point at form fields: the Form turns `fields` red and shows the message
 * under each one, instead of a single sentence listing every possible mistake.
 */

/** One field is wrong. */
export function fieldError(key: string, message: string, status = 400) {
  return new ServiceError(message, status, { [key]: message });
}

/**
 * Several fields may be wrong (a zod result's issues). Each wrong field gets its own message from
 * `messages`; the summary under the form tells the user to look at the red fields.
 */
export function issuesError(
  issues: readonly { path: readonly PropertyKey[] }[],
  messages: Record<string, string>,
) {
  const fields: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !fields[key]) fields[key] = messages[key] ?? t('Giá trị chưa hợp lệ.');
  }
  const keys = Object.keys(fields);
  return new ServiceError(
    keys.length === 1 ? fields[keys[0]] : t('Vui lòng sửa các ô được tô đỏ.'),
    400,
    fields,
  );
}

/** Problem Details keys ("FullName", "Request.PhoneNumber", "$.email") as form keys ("fullName"). */
export function formKey(key: string) {
  const last = key.split('.').filter(Boolean).at(-1) ?? key;
  const clean = last.replace(/^\$/, '').replace(/\[\d+\]$/, '');
  return clean.charAt(0).toLowerCase() + clean.slice(1);
}
