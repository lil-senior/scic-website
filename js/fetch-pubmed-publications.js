/**
 * Fetch publications from PubMed API for key SCIC members
 * Runs via GitHub Actions on a schedule
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const KEY_MEMBERS = [
  { name: 'Marco Gotte', searchTerms: ['Gotte M', 'Gotte Marco', 'Marco Götte','Götte M' ], keywords: ['cardiac MRI', 'CMR', 'cardiac imaging', 'iCMR', 'Ablation', 'Interventional magnetic resonance imaging','Interventional cardiovascular magnetic resonance imaging','Interventional cardiac magnetic resonance imaging', 'cardiac magnetic resonance imaging'] },
  { name: 'Julio Garcia Flores', searchTerms: ['Garcia Flores J', 'Garcia-Flores J', 'Garcia J', 'Julio Garcia'], keywords: ['cardiac MRI', 'CMR', '4D flow', 'cardiac magnetic resonance'] },
  { name: 'Junior Reitzema', searchTerms: ['Reitzema J', 'Reitzema P', 'Reitzema Junior', 'Pieter J Reitzema', 'Reitzema PJ'], keywords: ['cardiac MRI', 'CMR', 'ECG', 'Interventional magnetic resonance imaging','Interventional cardiovascular magnetic resonance imaging', 'Interventional cardiac magnetic resonance imaging','cardiac magnetic resonance imaging', 'electrocardiography'] },
  { name: 'James White', searchTerms: ['White J', 'White JA', 'White James'], keywords: ['cardiac MRI', 'CMR', 'cardiac imaging', 'cardiac magnetic resonance']},
  { name: 'Hourieh Jamalidinan', searchTerms: ['Jamalidinan', 'Jamalidinan Hourieh'], keywords: ['cardiac MRI', 'CMR', '4D flow'] },
  { name: 'Justin Tse', searchTerms: ['Tse J', 'Tse Justin', 'Justin Tse', 'Justin J. Tse', 'JT Tse'], keywords: ['cardiac MRI', 'CMR', 'cardiac imaging', 'cardiac magnetic resonance'] }
];

const OUTPUT_FILE = path.join(__dirname, '..', 'publications.json');
const PUBMED_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const MAX_RESULTS = 5; // Per author

/**
 * Make HTTPS request to PubMed API
 */
function fetchAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Parse PMID list from esearch XML response
 */
function parsePMIDs(xmlData) {
  const pmidMatches = xmlData.match(/<Id>(\d+)<\/Id>/g);
  return pmidMatches ? pmidMatches.map(m => m.replace(/<\/?Id>/g, '')) : [];
}

/**
 * Parse publication data from efetch response (XML)
 */
function parsePublication(xmlData) {
  try {
    // Extract title
    const titleMatch = xmlData.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Unknown Title';

    // Extract journal
    const journalMatch = xmlData.match(/<Title>(.*?)<\/Title>/);
    const journal = journalMatch ? journalMatch[1].replace(/<[^>]*>/g, '') : 'Journal';

    // Extract authors
    const authorMatches = xmlData.match(/<LastName>([^<]+)<\/LastName>/g);
    let authors = '';
    if (authorMatches && authorMatches.length > 0) {
      const firstAuthor = authorMatches[0].replace(/<\/?LastName>/g, '');
      authors = authorMatches.length > 1 ? `${firstAuthor} et al.` : firstAuthor;
    }

    // Extract year
    const yearMatch = xmlData.match(/<Year>(\d{4})<\/Year>/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

    // Extract PMID
    const pmidMatch = xmlData.match(/<PMID[^>]*>(\d+)<\/PMID>/);
    const pmid = pmidMatch ? pmidMatch[1] : '';

    // Extract DOI if available
    const doiMatch = xmlData.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
    const doi = doiMatch ? doiMatch[1] : '';

    return { title, journal, authors, year, pmid, doi };
  } catch (e) {
    console.error('Error parsing publication:', e);
    return null;
  }
}

/**
 * Fetch publications for a single author (tries multiple name variations)
 */
async function fetchAuthorPublications(member) {
  console.log(`Fetching publications for ${member.name}...`);

  const searchTerms = Array.isArray(member.searchTerms) ? member.searchTerms : [member.searchTerms];
  const allPublications = [];
  const seenPMIDs = new Set(); // Track PMIDs to avoid duplicates within this author

  try {
    for (const searchTerm of searchTerms) {
      try {
        // Step 1: Build search query with author name + optional keywords
        let query = `${searchTerm}[au]`;
        if (member.keywords && member.keywords.length > 0) {
          const keywordQuery = member.keywords.map(kw => `"${kw}"`).join(' OR ');
          query += ` AND (${keywordQuery})`;
        }

        // Search for PMIDs (using XML format, more reliable than JSON)
        const searchUrl = `${PUBMED_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${MAX_RESULTS}&usehistory=y`;
        const searchData = await fetchAPI(searchUrl);

        // Parse XML response for esearch
        const pmids = parsePMIDs(searchData);

        if (pmids.length === 0) {
          console.log(`  No results for search term: "${searchTerm}"`);
          continue;
        }

        console.log(`  Found ${pmids.length} results for "${searchTerm}"`);

        // Step 2: Fetch details for each PMID
        for (const pmid of pmids) {
          // Skip if we've already fetched this PMID for this author
          if (seenPMIDs.has(pmid)) {
            continue;
          }
          seenPMIDs.add(pmid);

          try {
            const fetchUrl = `${PUBMED_API}/efetch.fcgi?db=pubmed&id=${pmid}&rettype=xml`;
            const fetchData = await fetchAPI(fetchUrl);
            const pub = parsePublication(fetchData);

            if (pub) {
              pub.author = member.name;
              allPublications.push(pub);
            }

            // Rate limiting: wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (e) {
            console.error(`  Error fetching PMID ${pmid}:`, e.message);
          }
        }

        // Rate limiting between search terms
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`  Error with search term "${searchTerm}":`, error.message);
      }
    }

    if (allPublications.length === 0) {
      console.log(`  No publications found for ${member.name}`);
    } else {
      console.log(`  Total: ${allPublications.length} publications for ${member.name}`);
    }

    return allPublications;
  } catch (error) {
    console.error(`Error fetching publications for ${member.name}:`, error.message);
    return [];
  }
}

/**
 * Main function: fetch all publications and save to JSON
 */
async function main() {
  console.log('Starting PubMed publication fetch...');
  const allPublications = [];

  for (const member of KEY_MEMBERS) {
    const pubs = await fetchAuthorPublications(member);
    allPublications.push(...pubs);

    // Rate limiting between authors
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Deduplicate by PMID and sort by year (newest first)
  const unique = {};
  allPublications.forEach(pub => {
    if (!unique[pub.pmid] || parseInt(pub.year) > parseInt(unique[pub.pmid].year)) {
      unique[pub.pmid] = pub;
    }
  });

  let sorted = Object.values(unique).sort((a, b) => parseInt(b.year) - parseInt(a.year));

  // Filter out publications with empty authors AND empty doi
  sorted = sorted.filter(pub => {
    const hasAuthors = pub.authors && pub.authors.trim() !== '';
    const hasDoi = pub.doi && pub.doi.trim() !== '';
    return hasAuthors || hasDoi;
  });
  // Ensure data directory exists
  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sorted, null, 2));
  console.log(`✓ Saved ${sorted.length} publications to ${OUTPUT_FILE}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});