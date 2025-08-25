const VariantPicker = ({ variants, ...props }) => {
  console.log('VariantPicker received variants:', variants);
  
  if (variants.length === (0 || 1)) return null;

  return (
    <select
      {...props}
      className="form-select appearance-none w-full relative mb-3 sm:mb-0 flex-grow sm:mr-3 pl-3 py-2 bg-white border border-gray-300 focus:border-gray-500 shadow-sm text-gray-500 text-sm focus:outline-none focus:text-gray-900 rounded ring-0 focus:ring-0"
    >
             {variants.map((variant) => {
         const { external_id, name, size, color, retail_price, currency } = variant;
         
         // Create a more descriptive option text
         let optionText = name;
         
                   // Use direct size and color properties if available
          if (size && color && size !== null && color !== null) {
            optionText = `${size} - ${color}`;
          }
         
         // Add price if available
         if (retail_price && currency) {
           const formattedPrice = new Intl.NumberFormat("en-US", {
             style: "currency",
             currency: currency,
           }).format(retail_price);
           optionText += ` (${formattedPrice})`;
         }
         
         return (
           <option key={external_id} value={external_id}>
             {optionText}
           </option>
         );
       })}
    </select>
  );
};

export default VariantPicker;
