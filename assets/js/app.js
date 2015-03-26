$(document).ready(function() {
  checkLogin();
});

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  return false;
});

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  return false;
});

$("#logout-btn").click(function() {
  sessionStorage.removeItem("fulcrum_token");
  location.reload();
  return false;
});

$("#save-btn").click(function() {
  if ($(".right-text").val().length > 0) {
    if ($("#classification-set-select").val() == "New Classification Set") {
      if (JSON.parse($(".right-text").val()).classification_set.name === "") {
        alert("Classification Set name is required!\nDescription is optional.");
      }
      else {
        $("<div class='modal-backdrop fade in'></div>").appendTo(document.body);
        $("#loading").show();
        $.ajax({
          url: "https://api.fulcrumapp.com/api/v2/classification_sets",
          type: "POST",
          contentType: "application/json",
          data: $(".right-text").val(),
          headers: {
            "X-ApiToken": $("#context-select").val()
          },
          success: function(data) {
            alert("Classification Set saved!");
            fetchClassificationSets(data.classification_set.id);
          },
          complete: function() {
            $("#loading").hide();
            $(".modal-backdrop").remove();
          }
        });
      }
    }
    else if (confirm("Are you sure you want to update the " + $("#classification-set-select option:selected").html() + " Classification Set?") === true) {
      $("<div class='modal-backdrop fade in'></div>").appendTo(document.body);
      $("#loading").show();
      $.ajax({
        url: "https://api.fulcrumapp.com/api/v2/classification_sets/"+$("#classification-set-select").val()+".json",
        type: "PUT",
        contentType: "application/json",
        data: $(".right-text").val(),
        headers: {
          "X-ApiToken": $("#context-select").val()
        },
        success: function(data) {
          alert("Updates saved!");
        },
        complete: function() {
          $("#loading").hide();
          $(".modal-backdrop").remove();
        }
      });
    }
  }
  else {
    alert("Nothing to save!");
  }
  $(".dropdown.open .dropdown-toggle").dropdown("toggle");
  return false;
});

$("#csv-btn").click(function() {
  var csv = $(".left-text").val();
  if (csv.length > 0) {
    var csvData = "data:application/csv;charset=utf-8," + encodeURIComponent(csv);
    $(this).attr({
      "href": csvData,
      "target": "_blank",
      "download": $("#classification-set-select option:selected").html() + ".csv"
    });
  }
  else {
    alert("Nothing to download!");
    $(".dropdown.open .dropdown-toggle").dropdown("toggle");
    return false;
  }
});

$("#json-btn").click(function() {
  var json = $(".right-text").val();
  if (json.length > 0) {
    var jsonData = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    $(this).attr({
      "href": jsonData,
      "target": "_blank",
      "download": $("#classification-set-select option:selected").html() + ".json"
    });
  }
  else {
    alert("Nothing to download!");
    $(".dropdown.open .dropdown-toggle").dropdown("toggle");
    return false;
  }
});

$("#csv-upload-btn").click(function() {
  $("#csv-upload-input").trigger("click");
  return false;
});

$("#csv-upload-input").change(function(evt) {
  var file = evt.target.files[0];
  Papa.parse(file, {
    header: false,
    dynamicTyping: true,
    complete: function(results) {
      $(".left-text").val(Papa.unparse(results));
      ClassMaker.convert();
    }
  });
});

/* Select an account */
$("#context-select").change(function() {
  fetchClassificationSets();
  $(".left-text").val("");
  $(".right-text").val("");
  csName = undefined;
  csDescription = undefined;
});

/* Select a classification set */
$("#classification-set-select").change(function() {
  if ($(this).val().length > 0) {
    if ($(this).val() == "New Classification Set") {
      $(".left-text").val("");
      $(".right-text").val("");
      csName = undefined;
      csDescription = undefined;
    }
    else {
      $("<div class='modal-backdrop fade in'></div>").appendTo(document.body);
      $("#loading").show();
      $.ajax({
        url: "https://api.fulcrumapp.com/api/v2/classification_sets/" + $(this).val() + ".json",
        type: "GET",
        contentType: "application/json",
        dataType: "json",
        headers: {
          "X-ApiToken": $("#context-select").val()
        },
        success: function(data) {
    			delete data.classification_set.id;
          delete data.classification_set.created_at;
          delete data.classification_set.updated_at;
          $(".right-text").val(JSON.stringify(data, null, '  '));
    			ClassMaker.convertToCSV();
        },
        complete: function() {
          $("#loading").hide();
          $(".modal-backdrop").remove();
        }
      });
    }
  }
  else {
    $(".left-text").val("");
    $(".right-text").val("");
  }
});

function checkLogin() {
  /* Fulcrum API token stored in sessionStorage. If not set, force BASIC authentication and grab the first API token. Switch to localStorage if security is less of a concern.*/
  if (!sessionStorage.getItem("fulcrum_token")) {
    $(".navbardropdown").addClass("hide");
    $("#logout-divider").addClass("hide");
    $("#logout-btn").addClass("hide");
  } else {
    $(".navbardropdown").removeClass("hide");
    $("#login-btn").addClass("hide");
    $("#logout-divider").removeClass("hide");
    $("#logout-btn").removeClass("hide");
    $("#loginModal").modal("hide");
    fetchAccounts();
  }
}

function login() {
  var username = $("#email").val();
  var password = $("#password").val();
  $.ajax({
    type: "GET",
    url: "https://api.fulcrumapp.com/api/v2/users.json",
    contentType: "application/json",
    dataType: "json",
    headers: {
      "Authorization": "Basic " + btoa(username + ":" + password)
    },
    statusCode: {
      401: function() {
        alert("Incorrect credentials, please try again.");
      }
    },
    success: function (data) {
      sessionStorage.setItem("fulcrum_token", btoa(data.user.contexts[0].api_token));
      checkLogin();
    }
  });
}

function fetchAccounts() {
  $("<div class='modal-backdrop fade in'></div>").appendTo(document.body);
  $("#loading").show();
  $.ajax({
    url: "https://api.fulcrumapp.com/api/v2/users.json",
    type: "GET",
    contentType: "application/json",
    dataType: "json",
    headers: {
      "X-ApiToken": atob(sessionStorage.getItem("fulcrum_token"))
    },
    success: function(data) {
      var options = "";
      contexts = $(data.user.contexts).sort(function(a,b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
      $.each(contexts, function(index, context) {
        options += "<option value='" + context.api_token + "'>" + context.name + "</option>";
      });
      $("#context-select").html(options);
    },
    complete: function() {
      $("#account").html($("#context-select option:selected").text());
      $("#loading").hide();
      $(".modal-backdrop").remove();
      fetchClassificationSets();
    }
  });
}

function fetchClassificationSets(id) {
  $.ajax({
    url: "https://api.fulcrumapp.com/api/v2/classification_sets.json",
    type: "GET",
    contentType: "application/json",
    dataType: "json",
    headers: {
      "X-ApiToken": $("#context-select").val()
    },
    success: function(data) {
      var options = "<option value=''>Select a Classification Set</option>" +
                    "<option value='New Classification Set'>--New Classification Set--</option>";
      classification_sets = $(data.classification_sets).sort(function(a,b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
      $.each(classification_sets, function(index, classification_set) {
        options += "<option value='" + classification_set.id + "'>" + classification_set.name + "</option>";
      });
      $("#classification-set-select").html(options);
    },
    complete: function() {
      if (id) {
        $("#classification-set-select").val(id);
      }
    }
  });
}
