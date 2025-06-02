/**
 * Stock display fixer
 * Changes negative stock numbers to show as "0 במלאי"
 */
jQuery(document).ready(function($) {
    // Only run on product pages with stock display
    if ($('.stock').length === 0) {
        return;
    }

    // Get the stock element
    var $stockElement = $('.stock');
    var stockText = $stockElement.text();
    
    // Check for negative stock
    var negativeMatch = stockText.match(/-\d+/);
    
    if (negativeMatch) {
        console.log('Stock display fix: Changing negative stock to zero');
        
        // Replace negative stock with "0 במלאי"
        var newText = stockText.replace(/-\d+ במלאי/, '0 במלאי');
        $stockElement.text(newText);
    }
});
