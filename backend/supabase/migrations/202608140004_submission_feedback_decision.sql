begin;

alter type public.review_decision add value if not exists 'feedback';

commit;
