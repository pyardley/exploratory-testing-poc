# WidgetWorks — Product Description

## What it is

WidgetWorks is a small business inventory catalog: a place for a shop owner to list the physical "widgets" they sell, keep the catalog up to date, and give prospective customers an easy way to browse the catalog and get in touch. It's a lightweight alternative to a full e-commerce platform for a business that takes orders offline (by phone, by email, in person) but wants a professional web presence and an easy way to manage what's currently in stock.

## Who it's for

- **Dana, the shop owner.** Adds new widgets as stock arrives, updates prices and descriptions, removes items that have sold out or been discontinued, and keeps her account details current. Dana is not a developer and expects the tool to behave like any other business software she's used — predictable, forgiving of mistakes, clear about what just happened.
- **Sam, a prospective customer.** Arrives from a search engine or a link, browses the catalog to see what's available, looks at individual items for details, and — if interested — gets in touch via the contact page. Sam has no account and isn't expected to create one; browsing and contacting are both anonymous.

## Core capabilities

- **Browse the catalog.** A searchable, sortable, paginated grid of every widget currently listed.
- **View item detail.** A dedicated page per widget with its full description, price, and photo.
- **Manage inventory (Create/Update/Delete).** Add a new widget, edit an existing one, or remove one that's no longer available.
- **Manage account.** Update basic profile and notification preferences.
- **Get in touch.** A contact form for questions, plus an FAQ for common questions.
- **Learn about the company.** A company story/about page with background and mission.

## Pages

| Page | Purpose |
|---|---|
| **Home** | Landing page: brand introduction, highlights, and entry points into the catalog. |
| **Catalog** | Grid of all widgets, with search, sort, and pagination. |
| **Item detail** | Full information for a single widget. |
| **New item** | Form to add a widget to the catalog. |
| **Edit item** | Form to update or delete an existing widget. |
| **Account** | Profile and notification settings. |
| **Contact** | Support/contact form plus frequently asked questions. |
| **About** | Company background, mission, and history. |

## Technical shape

A small Node/Express backend persists the widget catalog and account data server-side, serving a set of static HTML/CSS/JS pages that call a JSON API for catalog and account operations. There is no authentication system in this version — account and inventory management are treated as available to the shop owner directly.

## Brand

WidgetWorks uses a single consistent visual identity across the product: one logo mark, one primary brand color, one typeface, and one spacing rhythm. The **Home** page is the canonical representation of that identity — every other page in the product is expected to match it.
