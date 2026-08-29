import { createClient } from '@supabase/supabase-js';

// Stesso progetto Supabase della versione vanilla — nessuna migrazione dati necessaria.
const SUPABASE_URL = 'https://jmdrndsfkjmcqntypsfb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gQTlGeUqoji-YqTiZN9VRA_fC7fOGRE';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
