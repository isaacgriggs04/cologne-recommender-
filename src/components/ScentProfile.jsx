import React, { useState, useMemo } from 'react';
import { useFragranceContext } from '../context/FragranceContext';
import ScentDot from './ScentDot';
import FloatingChatButton from './FloatingChatButton';

// Map accords and notes to scent clusters
const accordToCluster = {
  // Fresh
  'citrus': 'Fresh',
  'aquatic': 'Fresh',
  'marine': 'Fresh',
  'green': 'Fresh',
  'fresh': 'Fresh',
  'ozonic': 'Fresh',
  'mint': 'Fresh',
  'herbal': 'Fresh',
  
  // Sweet
  'vanilla': 'Sweet',
  'sweet': 'Sweet',
  'gourmand': 'Sweet',
  'honey': 'Sweet',
  'caramel': 'Sweet',
  'chocolate': 'Sweet',
  'sugar': 'Sweet',
  'fruity': 'Sweet',
  
  // Spicy
  'spicy': 'Spicy',
  'warm spicy': 'Spicy',
  'cinnamon': 'Spicy',
  'pepper': 'Spicy',
  'ginger': 'Spicy',
  'cardamom': 'Spicy',
  'clove': 'Spicy',
  'saffron': 'Spicy',
  
  // Woody
  'woody': 'Woody',
  'cedar': 'Woody',
  'sandalwood': 'Woody',
  'pine': 'Woody',
  'oak': 'Woody',
  'mahogany': 'Woody',
  'vetiver': 'Woody',
  'patchouli': 'Woody',
  
  // Clean
  'clean': 'Clean',
  'white floral': 'Clean',
  'lavender': 'Clean',
  'cotton': 'Clean',
  'linen': 'Clean',
  'soap': 'Clean',
  'musk': 'Clean',
  'powdery': 'Clean',
  
  // Additional mappings
  'amber': 'Spicy',
  'balsamic': 'Woody',
  'leather': 'Woody',
  'tobacco': 'Woody',
  'smoky': 'Woody',
  'floral': 'Clean',
  'rose': 'Clean',
  'jasmine': 'Clean',
};

const noteToCluster = {
  // Fresh
  'citrus': 'Fresh',
  'lemon': 'Fresh',
  'lime': 'Fresh',
  'orange': 'Fresh',
  'bergamot': 'Fresh',
  'grapefruit': 'Fresh',
  'mint': 'Fresh',
  'peppermint': 'Fresh',
  'aquatic': 'Fresh',
  'ocean': 'Fresh',
  'water': 'Fresh',
  'green tea': 'Fresh',
  'cucumber': 'Fresh',
  
  // Sweet
  'vanilla': 'Sweet',
  'honey': 'Sweet',
  'caramel': 'Sweet',
  'chocolate': 'Sweet',
  'sugar': 'Sweet',
  'fruity': 'Sweet',
  'apple': 'Sweet',
  'pear': 'Sweet',
  'berry': 'Sweet',
  
  // Spicy
  'cinnamon': 'Spicy',
  'pepper': 'Spicy',
  'ginger': 'Spicy',
  'cardamom': 'Spicy',
  'clove': 'Spicy',
  'nutmeg': 'Spicy',
  'spices': 'Spicy',
  
  // Woody
  'cedar': 'Woody',
  'sandalwood': 'Woody',
  'pine': 'Woody',
  'oak': 'Woody',
  'mahogany': 'Woody',
  'vetiver': 'Woody',
  'patchouli': 'Woody',
  'wood': 'Woody',
  'woody notes': 'Woody',
  
  // Clean
  'lavender': 'Clean',
  'cotton': 'Clean',
  'linen': 'Clean',
  'soap': 'Clean',
  'musk': 'Clean',
  'white musk': 'Clean',
  'powdery': 'Clean',
  'floral': 'Clean',
  'rose': 'Clean',
  'jasmine': 'Clean',
};

const clusterPositions = {
  Fresh: { x: 20, y: 25 },
  Sweet: { x: 60, y: 30 },
  Spicy: { x: 75, y: 60 },
  Woody: { x: 40, y: 70 },
  Clean: { x: 15, y: 55 },
};

const clusterDescriptions = {
  Fresh: {
    color: 'blue',
    description: 'Bright, invigorating scents that evoke crisp air, citrus fruits, and aquatic notes. Perfect for daytime wear and warm weather.',
    examples: 'Citrus, mint, ocean breeze, green tea, cucumber',
  },
  Sweet: {
    color: 'pink',
    description: 'Warm, comforting fragrances with gourmand and dessert-like qualities. Often associated with vanilla, honey, and caramel notes.',
    examples: 'Vanilla, honey, caramel, chocolate, sugar',
  },
  Spicy: {
    color: 'red',
    description: 'Bold, warming scents with aromatic spices that add depth and complexity. Great for evening wear and cooler seasons.',
    examples: 'Cinnamon, pepper, ginger, cardamom, clove',
  },
  Woody: {
    color: 'amber',
    description: 'Earthy, grounding fragrances derived from trees and woods. These scents are often rich, warm, and long-lasting.',
    examples: 'Cedar, sandalwood, pine, oak, mahogany',
  },
  Clean: {
    color: 'cyan',
    description: 'Fresh, minimalist scents that evoke cleanliness and simplicity. Often light, airy, and suitable for everyday wear.',
    examples: 'Lavender, cotton, linen, soap, white musk',
  },
};

const ScentProfile = () => {
  const [selectedDot, setSelectedDot] = useState(null);
  const { getCollection, getWishlist } = useFragranceContext();

  const collection = getCollection();
  const wishlist = getWishlist();

  // Aggregate accords and notes from collection and wishlist
  const compositeProfile = useMemo(() => {
    const allFragrances = [...collection, ...wishlist];

    if (allFragrances.length === 0) {
      return { accords: {}, notes: {}, totalFragrances: 0 };
    }

    const accordCounts = {};
    const noteCounts = {};

    allFragrances.forEach(fragrance => {
      // Count accords
      const accords = fragrance.accords || fragrance.fragranceData?.['Main Accords'] || [];
      const accordsPercentage = fragrance.accordsPercentage || fragrance.fragranceData?.['Main Accords Percentage'] || {};
      
      accords.forEach(accord => {
        const accordLower = accord.toLowerCase();
        const weight = accordsPercentage[accord] === 'Dominant' ? 3 : 
                      accordsPercentage[accord] === 'Prominent' ? 2 : 1;
        accordCounts[accordLower] = (accordCounts[accordLower] || 0) + weight;
      });

      // Count notes
      const notes = fragrance.notes || fragrance.fragranceData?.['General Notes'] || [];
      notes.forEach(note => {
        const noteLower = note.toLowerCase();
        noteCounts[noteLower] = (noteCounts[noteLower] || 0) + 1;
      });
    });

    return {
      accords: accordCounts,
      notes: noteCounts,
      totalFragrances: allFragrances.length,
    };
  }, [collection, wishlist]);

  // Map accords and notes to clusters and create scent dots
  const scentDots = useMemo(() => {
    const clusterCounts = {
      Fresh: 0,
      Sweet: 0,
      Spicy: 0,
      Woody: 0,
      Clean: 0,
    };

    // Process accords
    Object.entries(compositeProfile.accords).forEach(([accord, count]) => {
      const cluster = accordToCluster[accord];
      if (cluster) {
        clusterCounts[cluster] += count;
      }
    });

    // Process notes
    Object.entries(compositeProfile.notes).forEach(([note, count]) => {
      const cluster = noteToCluster[note];
      if (cluster) {
        clusterCounts[cluster] += count;
      }
    });

    // Create dots for each cluster with counts
    const dots = [];
    let dotId = 1;

    Object.entries(clusterCounts).forEach(([cluster, count]) => {
      if (count > 0) {
        const basePos = clusterPositions[cluster];
        // Create multiple dots based on intensity, with slight randomization
        const numDots = Math.min(Math.ceil(count / 2), 5); // Max 5 dots per cluster
        
        for (let i = 0; i < numDots; i++) {
          const offsetX = (Math.random() - 0.5) * 15;
          const offsetY = (Math.random() - 0.5) * 15;
          dots.push({
            id: dotId++,
            name: cluster,
            x: Math.max(5, Math.min(95, basePos.x + offsetX)),
            y: Math.max(5, Math.min(95, basePos.y + offsetY)),
            cluster: cluster,
            intensity: count,
          });
        }
      }
    });

    return dots;
  }, [compositeProfile]);

  const handleDotClick = (scent) => {
    setSelectedDot(selectedDot?.id === scent.id ? null : scent);
  };

  const totalItems = collection.length + wishlist.length;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-tight text-gray-900 mb-2">Scent Profile</h1>
          <p className="text-lg text-gray-500 font-light">
            {totalItems > 0 
              ? `Composite profile based on ${collection.length} collection ${collection.length === 1 ? 'item' : 'items'} and ${wishlist.length} wishlist ${wishlist.length === 1 ? 'item' : 'items'}`
              : 'Add fragrances to your collection or wishlist to see your scent profile'}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No fragrances in your collection or wishlist yet.</p>
            <p className="text-gray-400 text-sm">Add fragrances to see your personalized scent profile visualization.</p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Main Map Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="relative w-full h-[600px] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {/* Cluster Labels */}
                <div className="absolute top-6 left-6 text-xs uppercase tracking-widest font-medium text-blue-600">Fresh</div>
                <div className="absolute top-6 right-1/3 text-xs uppercase tracking-widest font-medium text-pink-600">Sweet</div>
                <div className="absolute bottom-1/4 right-8 text-xs uppercase tracking-widest font-medium text-red-600">Spicy</div>
                <div className="absolute bottom-8 left-1/3 text-xs uppercase tracking-widest font-medium text-amber-700">Woody</div>
                <div className="absolute top-1/3 left-6 text-xs uppercase tracking-widest font-medium text-cyan-600">Clean</div>

                {/* Scent Dots */}
                {scentDots.map((scent) => (
                  <ScentDot
                    key={scent.id}
                    x={scent.x}
                    y={scent.y}
                    name={scent.name}
                    cluster={scent.cluster}
                    isSelected={selectedDot?.id === scent.id}
                    onClick={() => handleDotClick(scent)}
                  />
                ))}

                {/* Grid lines */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `
                      linear-gradient(to right, #000 1px, transparent 1px),
                      linear-gradient(to bottom, #000 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                  }} />
                </div>
              </div>

              {/* Selected Scent Info */}
              {selectedDot && (
                <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-100 transition-all animate-fade-in">
                  <h3 className="text-xl font-medium text-gray-900 mb-1">{selectedDot.name}</h3>
                  <p className="text-sm text-gray-500">
                    Cluster: <span className="font-medium text-gray-700">{selectedDot.cluster}</span>
                    {selectedDot.intensity && (
                      <> • Intensity: <span className="font-medium text-gray-700">{selectedDot.intensity}</span></>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-200 p-8 h-fit sticky top-24">
              <h2 className="text-xl font-medium text-gray-900 mb-6">Scent Clusters</h2>
              
              <div className="space-y-4">
                {Object.entries(clusterDescriptions).map(([clusterName, info]) => {
                  const colorClasses = {
                    blue: 'bg-blue-50 text-blue-900 border-blue-100',
                    pink: 'bg-pink-50 text-pink-900 border-pink-100',
                    red: 'bg-red-50 text-red-900 border-red-100',
                    amber: 'bg-amber-50 text-amber-900 border-amber-100',
                    cyan: 'bg-cyan-50 text-cyan-900 border-cyan-100',
                  };

                  const clusterCount = scentDots.filter(d => d.cluster === clusterName).length;

                  return (
                    <div
                      key={clusterName}
                      className={`p-5 rounded-xl border transition-all hover:shadow-sm ${colorClasses[info.color]}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-base">{clusterName}</h3>
                        {clusterCount > 0 && (
                          <span className="text-xs font-medium opacity-75">{clusterCount} {clusterCount === 1 ? 'note' : 'notes'}</span>
                        )}
                      </div>
                      <p className="text-sm mb-3 leading-relaxed opacity-90">{info.description}</p>
                      <div className="text-xs opacity-75">
                        <span className="font-medium">Examples:</span> {info.examples}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default ScentProfile;
