var Model = function() {
    this.company_list = [];
    this.attribute_list = [];
    this.attribute_data = {};
    this.charts = {};
    this.unused_color_list = [
        '#72abd4', '#60BD68', '#FAA43A', '#F17CB0', '#B276B2', '#DECF3F', '#F15854'
    ];
    this.used_colors = {};
    $('div#slider svg').remove();
    
    this.data = {};
}

Model.prototype.get_num_attributes = function() {
    return this.attribute_list.length;
}

Model.prototype.get_company_list = function() {
    return this.company_list;
}

Model.prototype.get_attribute_list = function() {
    return this.attribute_list;
}

Model.prototype.get_company_name = function(index) {
    return this.company_list[index];
}

Model.prototype.get_data = function(attribute_name, company_name) {
    if (company_name)
        return this.attribute_data[attribute_name][company_name];
    else
        return this.attribute_data[attribute_name];
}

Model.prototype.add_chart = function(attribute_name, chart) {
    this.charts[attribute_name] = new Chart(attribute_name)
}

Model.prototype.add_attribute = function(attribute_name, new_data) {
    this.attribute_list.push(attribute_name);
    this.attribute_data[attribute_name] = {};
    
    // NEW
    this.data[attribute_name] = [];
    // END NEW
    
    if (new_data) {
        this.attribute_data[attribute_name] = {};
        for (var i in this.company_list) {
            this.attribute_data[attribute_name][this.company_list[i]] = 
                    new_data.map(function(d) {
                return [d[0], d[parseInt(i) + 1]];
            });
        }
        
        // NEW
       //console.log(new_data);
        this.data[attribute_name] = new_data;
        console.log(this.data);
        // END NEW
    }
    
    this.update_chart_height();
}

Model.prototype.delete_attribute = function(attribute_name) {
    var i = this.attribute_list.indexOf(attribute_name);
    this.attribute_list.splice(i, 1);
    
    // Delete the data for that attribute, as well as the chart.
    delete this.attribute_data[attribute_name];
    delete this.charts[attribute_name];
    
    // NEW seems to work
    delete this.data[attribute_name]
    console.log(this.data);
    // END NEW
    
    // Go through the remaining charts and update their heights.
    this.update_chart_height();
}

Model.prototype.add_company = function(company_name, new_data) {
    // Add the new company to the company_list and assign it a color.
    this.company_list.push(company_name);
    this.used_colors[company_name] = this.unused_color_list.shift();
    
    // Add the data to attribute_data.
    for (var i in this.attribute_list) {
        this.attribute_data[this.attribute_list[i]][company_name] = 
            new_data.map(function(d) { return [d[0], d[parseInt(i) + 1]]; });
    }
    
    // NEW seems to work
    // Need to merge arrays.
    for (var i in this.attribute_list) {
        var curr_attribute = this.attribute_list[i];
        
        for (var j = 0; j < new_data.length; j++) {
            if (this.data[curr_attribute][j] === undefined) {
                this.data[curr_attribute][j] = [];
                this.data[curr_attribute][j]['Date'] = new_data[j]['Date']
            }
            this.data[curr_attribute][j][company_name] = new_data[j][curr_attribute];
        }
    }
    console.log(this.data);
    // END NEW
    
    
    //slider_add_company(company_name)
    //if (this.company_list.length > 1)
    //    update_slider_domain();
    
    this.update_chart_lines();
    //this.update_chart_domain();
}

Model.prototype.delete_company = function(company_name) {
    // Go through the data structure and delete data from this company.
    for (var j in this.attribute_list) {
        delete this.attribute_data[this.attribute_list[j]][company_name];
    }
    
    // NEW seems to work
    for (var j = 0; j < this.attribute_list.length; j++) {
        var curr_attribute = this.attribute_list[j];
        for (var k = 0; k < this.data[curr_attribute].length; k++) {
            delete this.data[curr_attribute][k][company_name];
            // need to delete array element if no other compnaies have this date.
        }
    }
    console.log(this.data);
    // END NEW
    
    // Remove the company from company_list.
    this.unused_color_list.unshift(this.used_colors[company_name]);
    delete this.used_colors[company_name];
    
    var i = this.company_list.indexOf(company_name);
    this.company_list.splice(i, 1);
    
    slider_remove_company(company_name);
    this.update_chart_lines();
    //this.update_chart_domain();
}

Model.prototype.get_color = function(company_name) {
    return this.used_colors[company_name];
}

Model.prototype.update_chart_lines = function() {
    for (chart in this.charts) {
        this.charts[chart].update_chart_lines();
    }
}

Model.prototype.update_chart_height = function() {
    Chart.prototype.set_height();
    for (chart in this.charts) {
        this.charts[chart].update_chart_height();
    }
}

Model.prototype.update_chart_domain = function(extent) {
    Chart.prototype.x.domain(extent);
    
    
    for (chart in this.charts) {
        this.charts[chart].update_chart_domain();
    }
}

Model.prototype.date_range = function() {
    // Since the x domain of all charts should be equal, return [min, max]
    // of the dates from all datasets.
    var min, max;
    
    for (var attribute in this.attribute_data) {
        for (var company in this.attribute_data[attribute]) {
            var local_min = d3.min(this.attribute_data[attribute][company], function(d) {
                if (d[1] !== null) return d[0];
            });
            var local_max = d3.max(this.attribute_data[attribute][company], function(d) {
                if (d[1] !== null) return d[0];
            });
            if ((min == undefined) || (local_min < min)) min = local_min;
            if ((max == undefined) || (local_max > max)) max = local_max;
        }
    }
    return [min, max];
}

Model.prototype.value_range = function(attribute) {
    // The y domain of all charts doesn't need to be the same. So return
    // the [min, max] of the values of this dataset.
    var min, max;
    
    for (company in this.attribute_data[attribute]) {
        var local_min = d3.min(this.attribute_data[attribute][company], function(d) {
            return d[1];
        });
        var local_max = d3.max(this.attribute_data[attribute][company], function(d) {
            return d[1];
        });
        if ((min == undefined) || (local_min < min)) min = local_min;
        if ((max == undefined) || (local_max > max)) max = local_max;
    }
    return [min, max];
}