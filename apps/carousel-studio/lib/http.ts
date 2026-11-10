import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { DEFAULT_BRAND, assertSlug } from './store';
import { WorkflowError } from './workflow';

export const brandOf = (req: Request) => assertSlug(new URL(req.url).searchParams.get('brand') ?? DEFAULT_BRAND, 'brand');

export function fail(e: unknown) {
  if (e instanceof WorkflowError) return NextResponse.json({ error: e.message }, { status: 409 });
  if (e instanceof ZodError) return NextResponse.json({ error: 'Invalid data: ' + e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') }, { status: 400 });
  const msg = e instanceof Error ? e.message : String(e);
  if (/ENOENT/.test(msg)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  console.error(e);
  return NextResponse.json({ error: msg }, { status: 500 });
}

/** Extract the first JSON object from text that may include ``` fences or prose around it. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON object found in the pasted text.');
  return JSON.parse(body.slice(start, end + 1));
}
