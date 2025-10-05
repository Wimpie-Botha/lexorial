import { createClient } from '@supabase/supabase-js'

// Use NEXT_PUBLIC_* env vars for values injected into the browser by Next.js.
// Make sure `.env.local` (in the lexorial folder) contains these keys and that you restart
// the dev server after changing env values.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.\n' +
			'Create a .env.local in the project root (lexorial) with these values and restart the dev server.'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


