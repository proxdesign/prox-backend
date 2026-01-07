--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: affiliate_partners; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.affiliate_partners (
    id integer NOT NULL,
    partner_name character varying(100) NOT NULL,
    commission_rate numeric(5,2),
    cookie_duration_days integer,
    api_available boolean DEFAULT false,
    api_endpoint character varying(255),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.affiliate_partners OWNER TO thepollees;

--
-- Name: affiliate_partners_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.affiliate_partners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.affiliate_partners_id_seq OWNER TO thepollees;

--
-- Name: affiliate_partners_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.affiliate_partners_id_seq OWNED BY public.affiliate_partners.id;


--
-- Name: agent_logs; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.agent_logs (
    id integer NOT NULL,
    agent_name character varying(100) NOT NULL,
    action_type character varying(100),
    details jsonb,
    result character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.agent_logs OWNER TO thepollees;

--
-- Name: agent_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.agent_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.agent_logs_id_seq OWNER TO thepollees;

--
-- Name: agent_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.agent_logs_id_seq OWNED BY public.agent_logs.id;


--
-- Name: analysis_reports; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.analysis_reports (
    id integer NOT NULL,
    report_type character varying(50),
    report_date timestamp without time zone DEFAULT now(),
    trends_analyzed integer[],
    report_data jsonb,
    human_notes text,
    key_insights text[]
);


ALTER TABLE public.analysis_reports OWNER TO thepollees;

--
-- Name: analysis_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.analysis_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.analysis_reports_id_seq OWNER TO thepollees;

--
-- Name: analysis_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.analysis_reports_id_seq OWNED BY public.analysis_reports.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer,
    description text,
    display_order integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.categories OWNER TO thepollees;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO thepollees;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: claude_analysis_cache; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.claude_analysis_cache (
    id integer NOT NULL,
    content_hash character varying(64),
    analysis_type character varying(50),
    analysis_result jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.claude_analysis_cache OWNER TO thepollees;

--
-- Name: claude_analysis_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.claude_analysis_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.claude_analysis_cache_id_seq OWNER TO thepollees;

--
-- Name: claude_analysis_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.claude_analysis_cache_id_seq OWNED BY public.claude_analysis_cache.id;


--
-- Name: content_snippets; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.content_snippets (
    id integer NOT NULL,
    product_id integer,
    problem_id integer,
    editorial_content text NOT NULL,
    why_trending text,
    user_quote text,
    created_at timestamp without time zone DEFAULT now(),
    approved boolean DEFAULT false,
    quality_score numeric(3,2)
);


ALTER TABLE public.content_snippets OWNER TO thepollees;

--
-- Name: content_snippets_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.content_snippets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.content_snippets_id_seq OWNER TO thepollees;

--
-- Name: content_snippets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.content_snippets_id_seq OWNED BY public.content_snippets.id;


--
-- Name: discovered_trends; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.discovered_trends (
    id integer NOT NULL,
    trend_name character varying(255),
    discovery_date timestamp without time zone DEFAULT now(),
    discovery_confidence numeric(3,2),
    current_stage character varying(50),
    platforms_detected text[],
    content_examples integer[],
    trend_characteristics jsonb,
    sustainability_score numeric(3,2),
    last_updated timestamp without time zone DEFAULT now(),
    trend_description text,
    keywords text[]
);


ALTER TABLE public.discovered_trends OWNER TO thepollees;

--
-- Name: discovered_trends_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.discovered_trends_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.discovered_trends_id_seq OWNER TO thepollees;

--
-- Name: discovered_trends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.discovered_trends_id_seq OWNED BY public.discovered_trends.id;


--
-- Name: feedback; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.feedback (
    id integer NOT NULL,
    session_id character varying(255),
    product_id integer,
    problem_id integer,
    feedback_type character varying(50),
    feedback_text text,
    user_segment character varying(100),
    user_style character varying(50),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feedback OWNER TO thepollees;

--
-- Name: feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.feedback_id_seq OWNER TO thepollees;

--
-- Name: feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.feedback_id_seq OWNED BY public.feedback.id;


--
-- Name: historical_trends; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.historical_trends (
    id integer NOT NULL,
    trend_name character varying(255),
    data_source character varying(100),
    time_period character varying(50),
    trend_data jsonb,
    collected_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.historical_trends OWNER TO thepollees;

--
-- Name: historical_trends_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.historical_trends_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.historical_trends_id_seq OWNER TO thepollees;

--
-- Name: historical_trends_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.historical_trends_id_seq OWNED BY public.historical_trends.id;


--
-- Name: platform_posts; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.platform_posts (
    id integer NOT NULL,
    post_id character varying(255) NOT NULL,
    platform character varying(50) NOT NULL,
    title text,
    content text,
    author character varying(255),
    url text,
    created_at timestamp without time zone,
    collected_at timestamp without time zone DEFAULT now(),
    engagement_data jsonb,
    metadata jsonb,
    processed boolean DEFAULT false,
    content_hash character varying(64)
);


ALTER TABLE public.platform_posts OWNER TO thepollees;

--
-- Name: platform_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.platform_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.platform_posts_id_seq OWNER TO thepollees;

--
-- Name: platform_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.platform_posts_id_seq OWNED BY public.platform_posts.id;


--
-- Name: principle_assessments; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.principle_assessments (
    id integer NOT NULL,
    trend_id integer,
    assessment_date timestamp without time zone DEFAULT now(),
    everyday_elevation_score numeric(3,2),
    tangible_potential_score numeric(3,2),
    intentional_living_score numeric(3,2),
    overall_prox_fit numeric(3,2),
    business_recommendation text,
    assessment_details jsonb,
    recommended_action character varying(100)
);


ALTER TABLE public.principle_assessments OWNER TO thepollees;

--
-- Name: principle_assessments_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.principle_assessments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.principle_assessments_id_seq OWNER TO thepollees;

--
-- Name: principle_assessments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.principle_assessments_id_seq OWNED BY public.principle_assessments.id;


--
-- Name: problems; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.problems (
    id integer NOT NULL,
    problem_text text NOT NULL,
    problem_category character varying(100),
    platform_mentions integer DEFAULT 1,
    trend_score numeric(4,2) DEFAULT 5.0,
    first_seen timestamp without time zone DEFAULT now(),
    last_updated timestamp without time zone DEFAULT now(),
    active boolean DEFAULT true
);


ALTER TABLE public.problems OWNER TO thepollees;

--
-- Name: problems_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.problems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.problems_id_seq OWNER TO thepollees;

--
-- Name: problems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.problems_id_seq OWNED BY public.problems.id;


--
-- Name: product_attributes; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.product_attributes (
    id integer NOT NULL,
    product_id integer,
    attribute_type character varying(50) NOT NULL,
    attribute_value character varying(100) NOT NULL,
    confidence_score numeric(3,2) DEFAULT 1.0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_attributes OWNER TO thepollees;

--
-- Name: product_attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.product_attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_attributes_id_seq OWNER TO thepollees;

--
-- Name: product_attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.product_attributes_id_seq OWNED BY public.product_attributes.id;


--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.product_categories (
    id integer NOT NULL,
    product_id integer,
    category_id integer,
    is_primary boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_categories OWNER TO thepollees;

--
-- Name: product_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.product_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_categories_id_seq OWNER TO thepollees;

--
-- Name: product_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.product_categories_id_seq OWNED BY public.product_categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.products (
    id integer NOT NULL,
    solution_id integer,
    affiliate_partner_id integer,
    product_name character varying(255) NOT NULL,
    brand character varying(100),
    price numeric(10,2),
    dimensions character varying(100),
    style character varying(50),
    material character varying(100),
    affiliate_url text NOT NULL,
    image_url text,
    rating numeric(3,2),
    review_count integer,
    trend_score numeric(4,2) DEFAULT 5.0,
    quality_score numeric(5,2) DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    last_checked timestamp without time zone DEFAULT now(),
    specs jsonb,
    amazon_data jsonb,
    last_updated timestamp with time zone,
    budget_tier character varying(20),
    installation_type character varying(20),
    pet_size character varying(20),
    cleaning_style character varying(20),
    refinement_type character varying(20)
);


ALTER TABLE public.products OWNER TO thepollees;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.products_id_seq OWNER TO thepollees;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.saved_searches (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    query text,
    filters jsonb NOT NULL,
    user_id character varying(255),
    session_id character varying(255),
    created_at timestamp without time zone DEFAULT now(),
    last_used timestamp without time zone DEFAULT now(),
    use_count integer DEFAULT 0,
    is_public boolean DEFAULT false
);


ALTER TABLE public.saved_searches OWNER TO thepollees;

--
-- Name: saved_searches_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.saved_searches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.saved_searches_id_seq OWNER TO thepollees;

--
-- Name: saved_searches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.saved_searches_id_seq OWNED BY public.saved_searches.id;


--
-- Name: solutions; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.solutions (
    id integer NOT NULL,
    problem_id integer,
    solution_description text NOT NULL,
    solution_type character varying(100),
    effectiveness_score numeric(4,2) DEFAULT 5.0,
    mention_count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.solutions OWNER TO thepollees;

--
-- Name: solutions_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.solutions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.solutions_id_seq OWNER TO thepollees;

--
-- Name: solutions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.solutions_id_seq OWNED BY public.solutions.id;


--
-- Name: trend_dashboard; Type: VIEW; Schema: public; Owner: thepollees
--

CREATE VIEW public.trend_dashboard AS
 SELECT dt.id,
    dt.trend_name,
    dt.discovery_date,
    dt.current_stage,
    dt.discovery_confidence,
    dt.platforms_detected,
    pa.overall_prox_fit,
    pa.recommended_action,
    array_length(dt.content_examples, 1) AS example_count
   FROM (public.discovered_trends dt
     LEFT JOIN public.principle_assessments pa ON ((dt.id = pa.trend_id)))
  ORDER BY dt.discovery_date DESC;


ALTER TABLE public.trend_dashboard OWNER TO thepollees;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: thepollees
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    session_id character varying(255) NOT NULL,
    initial_query text,
    problem_category character varying(100),
    user_preferences jsonb,
    products_shown jsonb,
    clicks integer DEFAULT 0,
    rejections integer DEFAULT 0,
    conversions integer DEFAULT 0,
    user_messages jsonb,
    started_at timestamp without time zone DEFAULT now(),
    last_activity timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_sessions OWNER TO thepollees;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: thepollees
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_sessions_id_seq OWNER TO thepollees;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: thepollees
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: affiliate_partners id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.affiliate_partners ALTER COLUMN id SET DEFAULT nextval('public.affiliate_partners_id_seq'::regclass);


--
-- Name: agent_logs id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.agent_logs ALTER COLUMN id SET DEFAULT nextval('public.agent_logs_id_seq'::regclass);


--
-- Name: analysis_reports id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.analysis_reports ALTER COLUMN id SET DEFAULT nextval('public.analysis_reports_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: claude_analysis_cache id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.claude_analysis_cache ALTER COLUMN id SET DEFAULT nextval('public.claude_analysis_cache_id_seq'::regclass);


--
-- Name: content_snippets id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.content_snippets ALTER COLUMN id SET DEFAULT nextval('public.content_snippets_id_seq'::regclass);


--
-- Name: discovered_trends id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.discovered_trends ALTER COLUMN id SET DEFAULT nextval('public.discovered_trends_id_seq'::regclass);


--
-- Name: feedback id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.feedback ALTER COLUMN id SET DEFAULT nextval('public.feedback_id_seq'::regclass);


--
-- Name: historical_trends id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.historical_trends ALTER COLUMN id SET DEFAULT nextval('public.historical_trends_id_seq'::regclass);


--
-- Name: platform_posts id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.platform_posts ALTER COLUMN id SET DEFAULT nextval('public.platform_posts_id_seq'::regclass);


--
-- Name: principle_assessments id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.principle_assessments ALTER COLUMN id SET DEFAULT nextval('public.principle_assessments_id_seq'::regclass);


--
-- Name: problems id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.problems ALTER COLUMN id SET DEFAULT nextval('public.problems_id_seq'::regclass);


--
-- Name: product_attributes id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_attributes ALTER COLUMN id SET DEFAULT nextval('public.product_attributes_id_seq'::regclass);


--
-- Name: product_categories id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_categories ALTER COLUMN id SET DEFAULT nextval('public.product_categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: saved_searches id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.saved_searches ALTER COLUMN id SET DEFAULT nextval('public.saved_searches_id_seq'::regclass);


--
-- Name: solutions id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.solutions ALTER COLUMN id SET DEFAULT nextval('public.solutions_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: affiliate_partners affiliate_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.affiliate_partners
    ADD CONSTRAINT affiliate_partners_pkey PRIMARY KEY (id);


--
-- Name: agent_logs agent_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.agent_logs
    ADD CONSTRAINT agent_logs_pkey PRIMARY KEY (id);


--
-- Name: analysis_reports analysis_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.analysis_reports
    ADD CONSTRAINT analysis_reports_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: claude_analysis_cache claude_analysis_cache_content_hash_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.claude_analysis_cache
    ADD CONSTRAINT claude_analysis_cache_content_hash_key UNIQUE (content_hash);


--
-- Name: claude_analysis_cache claude_analysis_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.claude_analysis_cache
    ADD CONSTRAINT claude_analysis_cache_pkey PRIMARY KEY (id);


--
-- Name: content_snippets content_snippets_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.content_snippets
    ADD CONSTRAINT content_snippets_pkey PRIMARY KEY (id);


--
-- Name: discovered_trends discovered_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.discovered_trends
    ADD CONSTRAINT discovered_trends_pkey PRIMARY KEY (id);


--
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (id);


--
-- Name: historical_trends historical_trends_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.historical_trends
    ADD CONSTRAINT historical_trends_pkey PRIMARY KEY (id);


--
-- Name: platform_posts platform_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.platform_posts
    ADD CONSTRAINT platform_posts_pkey PRIMARY KEY (id);


--
-- Name: platform_posts platform_posts_post_id_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.platform_posts
    ADD CONSTRAINT platform_posts_post_id_key UNIQUE (post_id);


--
-- Name: principle_assessments principle_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.principle_assessments
    ADD CONSTRAINT principle_assessments_pkey PRIMARY KEY (id);


--
-- Name: problems problems_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.problems
    ADD CONSTRAINT problems_pkey PRIMARY KEY (id);


--
-- Name: product_attributes product_attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_attributes
    ADD CONSTRAINT product_attributes_pkey PRIMARY KEY (id);


--
-- Name: product_attributes product_attributes_product_id_attribute_type_attribute_valu_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_attributes
    ADD CONSTRAINT product_attributes_product_id_attribute_type_attribute_valu_key UNIQUE (product_id, attribute_type, attribute_value);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_product_id_category_id_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_product_id_category_id_key UNIQUE (product_id, category_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: solutions solutions_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_id_key; Type: CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_id_key UNIQUE (session_id);


--
-- Name: idx_agent_logs_agent_name; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_agent_logs_agent_name ON public.agent_logs USING btree (agent_name);


--
-- Name: idx_agent_logs_created_at; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_agent_logs_created_at ON public.agent_logs USING btree (created_at DESC);


--
-- Name: idx_analysis_reports_date; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_analysis_reports_date ON public.analysis_reports USING btree (report_date);


--
-- Name: idx_analysis_reports_type; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_analysis_reports_type ON public.analysis_reports USING btree (report_type);


--
-- Name: idx_categories_parent; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_categories_parent ON public.categories USING btree (parent_id);


--
-- Name: idx_claude_cache_hash; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_claude_cache_hash ON public.claude_analysis_cache USING btree (content_hash);


--
-- Name: idx_claude_cache_type; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_claude_cache_type ON public.claude_analysis_cache USING btree (analysis_type);


--
-- Name: idx_content_snippets_problem_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_content_snippets_problem_id ON public.content_snippets USING btree (problem_id);


--
-- Name: idx_content_snippets_product_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_content_snippets_product_id ON public.content_snippets USING btree (product_id);


--
-- Name: idx_discovered_trends_confidence; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_discovered_trends_confidence ON public.discovered_trends USING btree (discovery_confidence);


--
-- Name: idx_discovered_trends_discovery_date; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_discovered_trends_discovery_date ON public.discovered_trends USING btree (discovery_date);


--
-- Name: idx_discovered_trends_stage; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_discovered_trends_stage ON public.discovered_trends USING btree (current_stage);


--
-- Name: idx_feedback_product_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_feedback_product_id ON public.feedback USING btree (product_id);


--
-- Name: idx_feedback_session_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_feedback_session_id ON public.feedback USING btree (session_id);


--
-- Name: idx_platform_posts_created_at; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_platform_posts_created_at ON public.platform_posts USING btree (created_at);


--
-- Name: idx_platform_posts_hash; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_platform_posts_hash ON public.platform_posts USING btree (content_hash);


--
-- Name: idx_platform_posts_platform; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_platform_posts_platform ON public.platform_posts USING btree (platform);


--
-- Name: idx_platform_posts_processed; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_platform_posts_processed ON public.platform_posts USING btree (processed);


--
-- Name: idx_posts_created; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_posts_created ON public.platform_posts USING btree (created_at DESC);


--
-- Name: idx_posts_platform; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_posts_platform ON public.platform_posts USING btree (platform);


--
-- Name: idx_principle_assessments_overall_fit; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_principle_assessments_overall_fit ON public.principle_assessments USING btree (overall_prox_fit);


--
-- Name: idx_principle_assessments_trend_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_principle_assessments_trend_id ON public.principle_assessments USING btree (trend_id);


--
-- Name: idx_problems_active; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_problems_active ON public.problems USING btree (active);


--
-- Name: idx_problems_category; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_problems_category ON public.problems USING btree (problem_category);


--
-- Name: idx_problems_trend_score; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_problems_trend_score ON public.problems USING btree (trend_score DESC);


--
-- Name: idx_product_attributes_product; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_product_attributes_product ON public.product_attributes USING btree (product_id);


--
-- Name: idx_product_attributes_type; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_product_attributes_type ON public.product_attributes USING btree (attribute_type);


--
-- Name: idx_product_categories_category; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_product_categories_category ON public.product_categories USING btree (category_id);


--
-- Name: idx_product_categories_product; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_product_categories_product ON public.product_categories USING btree (product_id);


--
-- Name: idx_products_active; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_active ON public.products USING btree (active);


--
-- Name: idx_products_brand; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_brand ON public.products USING btree (brand);


--
-- Name: idx_products_name_fts; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_name_fts ON public.products USING gin (to_tsvector('english'::regconfig, (product_name)::text));


--
-- Name: idx_products_partner; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_partner ON public.products USING btree (affiliate_partner_id);


--
-- Name: idx_products_price; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_price ON public.products USING btree (price);


--
-- Name: idx_products_price_rating; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_price_rating ON public.products USING btree (price, rating DESC);


--
-- Name: idx_products_rating; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_rating ON public.products USING btree (rating DESC);


--
-- Name: idx_products_rating_trend; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_rating_trend ON public.products USING btree (rating DESC, trend_score DESC);


--
-- Name: idx_products_refinement_type; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_refinement_type ON public.products USING btree (refinement_type);


--
-- Name: idx_products_solution_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_solution_id ON public.products USING btree (solution_id);


--
-- Name: idx_products_solution_style; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_solution_style ON public.products USING btree (solution_id, style);


--
-- Name: idx_products_style; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_style ON public.products USING btree (style);


--
-- Name: idx_products_trend_score; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_products_trend_score ON public.products USING btree (trend_score DESC);


--
-- Name: idx_saved_searches_created; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_saved_searches_created ON public.saved_searches USING btree (created_at DESC);


--
-- Name: idx_saved_searches_public; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_saved_searches_public ON public.saved_searches USING btree (is_public);


--
-- Name: idx_saved_searches_session; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_saved_searches_session ON public.saved_searches USING btree (session_id);


--
-- Name: idx_saved_searches_user; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_saved_searches_user ON public.saved_searches USING btree (user_id);


--
-- Name: idx_solutions_effectiveness; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_solutions_effectiveness ON public.solutions USING btree (effectiveness_score DESC);


--
-- Name: idx_solutions_problem; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_solutions_problem ON public.solutions USING btree (problem_id);


--
-- Name: idx_solutions_problem_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_solutions_problem_id ON public.solutions USING btree (problem_id);


--
-- Name: idx_user_sessions_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_user_sessions_id ON public.user_sessions USING btree (session_id);


--
-- Name: idx_user_sessions_session_id; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_user_sessions_session_id ON public.user_sessions USING btree (session_id);


--
-- Name: idx_user_sessions_started_at; Type: INDEX; Schema: public; Owner: thepollees
--

CREATE INDEX idx_user_sessions_started_at ON public.user_sessions USING btree (started_at DESC);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: content_snippets content_snippets_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.content_snippets
    ADD CONSTRAINT content_snippets_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id);


--
-- Name: content_snippets content_snippets_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.content_snippets
    ADD CONSTRAINT content_snippets_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: feedback feedback_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id);


--
-- Name: feedback feedback_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: feedback feedback_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_sessions(session_id);


--
-- Name: principle_assessments principle_assessments_trend_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.principle_assessments
    ADD CONSTRAINT principle_assessments_trend_id_fkey FOREIGN KEY (trend_id) REFERENCES public.discovered_trends(id);


--
-- Name: product_attributes product_attributes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_attributes
    ADD CONSTRAINT product_attributes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_categories product_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: product_categories product_categories_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_affiliate_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_affiliate_partner_id_fkey FOREIGN KEY (affiliate_partner_id) REFERENCES public.affiliate_partners(id);


--
-- Name: products products_solution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_solution_id_fkey FOREIGN KEY (solution_id) REFERENCES public.solutions(id) ON DELETE CASCADE;


--
-- Name: solutions solutions_problem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: thepollees
--

ALTER TABLE ONLY public.solutions
    ADD CONSTRAINT solutions_problem_id_fkey FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

